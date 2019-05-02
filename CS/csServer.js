const IOTA = require('../flash/iotaflash');
const globals = require('../flash/globalvariables');
const Helpers = require('../flash/functions');
const transfer = require('../flash/transfer');
const io = require('socket.io')(8080, { transports: ['websocket'], upgrade: false, 'pingInterval': 4000, 'pingTimeout': 360000 });
let csFlashObject;
let csMultiSignatures;
let partialDigests;
let digestsArr = [];
let currentCSSignature;
let transSent = 0;

function generateTransaction(value) {
    let transfers = [{ value: 1, address: globals.evSettlement }];
    let bundles = Helpers.createTransaction(csFlashObject, transfers, false);
    currentCSSignature = Helpers.signTransaction(csFlashObject, bundles);
    let signedByCS = transfer.appliedSignatures(bundles, currentCSSignature);
    return { signedByCS, bundles };
}
function closingTransaction() {
    let bundles = Helpers.createTransaction(
        csFlashObject,
        csFlashObject.flash.settlementAddresses,
        true
    );
    currentCSSignature = Helpers.signTransaction(csFlashObject, bundles);
    let signedByCS = transfer.appliedSignatures(bundles, currentCSSignature);
    return { bundles, signedByCS };
}


io.on('connection', function (socket) {
    console.log("EV connected");

    //2
    //Initializing Flash object, creating digests, multisignatures(basic settings)
    //For more info look at examples in the iota flash lib
    socket.on('initedEVFC', (evDigest) => {
        console.log('Flash channel on EV initialized');
        csFlashObject = IOTA.returnCSFlash();
        csFlashObject = IOTA.returnCSDigest(csFlashObject);
        partialDigests = csFlashObject.partialDigests;
        digestsArr[csFlashObject.userIndex] = partialDigests;
        digestsArr[+!csFlashObject.userIndex] = JSON.parse(evDigest);
        csMultiSignatures = IOTA.returnCSMultisignature(csFlashObject, digestsArr);
        csFlashObject.flash.remainderAddress = csMultiSignatures;

        for (let i = 1; i < csMultiSignatures.length; i++) {
            csMultiSignatures[i - 1].children.push(csMultiSignatures[i])
        }
        csFlashObject.flash.root = csMultiSignatures;
        let settlementAddresses = [globals.evSettlement, globals.csSettlement]
        csFlashObject.flash.settlementAddresses = settlementAddresses;
        csFlashObject.index = csFlashObject.partialDigests.length;
        socket.emit('initedCSFC', JSON.stringify(partialDigests));
    });

    //4
    //Channel is ready for transaction
    socket.on('channelReady', () => {
        console.log('Channel is ready');
        console.log('Starting transacting');
        const trans = generateTransaction(1);
        socket.emit('toSign', JSON.stringify(trans));
    });

    socket.on('signed', (res) => {
        let finalizedTransaction = JSON.parse(res);
        // let signedByCSTransaction = transfer.appliedSignatures(finalizedTransaction, currentCSSignature);
        csFlashObject = Helpers.applyTransfers(csFlashObject, finalizedTransaction);
        csFlashObject.bundles = finalizedTransaction;
        console.log("Transaction applied")
        transSent += 1;
        if (transSent > 1) {
            const finalTrans = closingTransaction();
            socket.emit('signToClose', JSON.stringify(finalTrans));
            return;
        }
        else {
            const trans = generateTransaction(1);
            socket.emit('toSign', JSON.stringify(trans));
        }
    });
    socket.on('signedToClose', (res) => {
        let finalizedTransaction = JSON.parse(res);
        // let signedByCSTransaction = transfer.appliedSignatures(finalizedTransaction, currentCSSignature);
        csFlashObject = Helpers.applyTransfers(csFlashObject, finalizedTransaction);
        csFlashObject.bundles = finalizedTransaction;
        console.log("Final Transaction applied")
        console.log(csFlashObject.bundles[0]);
    });

    socket.on('disconnect', function (reason) {
        console.log(reason);
        csFlashObject;
        csMultiSignatures;
        partialDigests;
        digestsArr = [];
        currentCSSignature;
        transSent = 0;
    });
    socket.emit('initialize');

});


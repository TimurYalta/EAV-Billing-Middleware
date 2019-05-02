const IOTA = require('../flash/iotaflash');
const globals = require('../flash/globalvariables');
const Helpers = require('../flash/functions');
const transfer = require('../flash/transfer');
const io = require('socket.io-client');
let evFlashObject;
let evMultiSignatures;
let partialDigests;
let digestsArr = [];
let settlementAddresses;
const socket = io.connect('http://localhost:8080', { transports: ['websocket'], 'pingInterval': 4000, 'pingTimeout': 360000 });

socket.on('connect', () => { console.log('Connected to server') });

//1
//Initializing Flash object, creating digests
socket.on('initialize', () => {
    evFlashObject = IOTA.returnEVFlash();
    evFlashObject = IOTA.returnEVDigest(evFlashObject);
    partialDigests = evFlashObject.partialDigests;
    digestsArr[evFlashObject.userIndex] = partialDigests;
    socket.emit('initedEVFC', JSON.stringify(partialDigests));

});

//3
//(basic settings)
//For more info look at examples in the iota flash lib
socket.on('initedCSFC', (csDigest) => {
    digestsArr[+!evFlashObject.userIndex] = JSON.parse(csDigest);
    evMultiSignatures = IOTA.returnEVMultisignature(evFlashObject, digestsArr);
    // console.log(evMultiSignatures);
    evFlashObject.flash.remainderAddress = evMultiSignatures;
    for (let i = 1; i < evMultiSignatures.length; i++) {
        evMultiSignatures[i - 1].children.push(evMultiSignatures[i])
    }
    evFlashObject.flash.root = evMultiSignatures;
    settlementAddresses = [globals.evSettlement, globals.csSettlement];
    evFlashObject.flash.settlementAddresses = settlementAddresses;
    evFlashObject.index = evFlashObject.partialDigests.length;
    console.log("Channel is ready");
    socket.emit('channelReady');
});

socket.on('toSign', (transaction) => {
    let transObject = JSON.parse(transaction);
    let currentEVSignature = Helpers.signTransaction(evFlashObject, transObject.bundles);
    let signedByEV = transfer.appliedSignatures(transObject.signedByCS, currentEVSignature);

    evFlashObject = Helpers.applyTransfers(evFlashObject, signedByEV);
    evFlashObject.bundles = signedByEV;
    socket.emit('signed', JSON.stringify(signedByEV));
    console.log("Transaction is sent");
});

socket.on('signToClose', (transaction) => {
    let transObject = JSON.parse(transaction);
    let currentEVSignature = Helpers.signTransaction(evFlashObject, transObject.bundles);
    let signedByEV = transfer.appliedSignatures(transObject.signedByCS, currentEVSignature);
    evFlashObject = Helpers.applyTransfers(evFlashObject, signedByEV);
    evFlashObject.bundles = signedByEV;
    socket.emit('signedToClose', JSON.stringify(signedByEV));
    console.log("Final transaction is sent");
});


socket.on('disconnect', (reason) => {
    console.log(reason);
});



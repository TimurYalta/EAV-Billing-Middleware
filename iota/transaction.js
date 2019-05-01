const iotaLib = require('@iota/core');
const converter = require('@iota/converter');
const helpers = require('./helper');
//9ZKXXGWFMGNDUADBGDBLEPVEQMUOWOKKZKDILGPPD9UBLLSNCKWBOEDRB9UDPJNSYQPLGDXZFHLCZLVLXBDQACIFPY
function sendTransaction(senderSeed, receiverSeed, value, tag, message, provider = 'https://nodes.thetangle.org:443') {
    const iota = iotaLib.composeAPI({
        provider: provider
    });
    const depth = 3;
    const minWeightMagnitude = 14;
    let trytesToSave;
    let transfers;
    return iota.getNewAddress(receiverSeed).then(
        (receiverAddress) => {
            transfers = [{
                address: receiverAddress,
                value: value,
                tag: converter.asciiToTrytes(tag),
                message: converter.asciiToTrytes(message)
            }];
        }
    ).then(
        () => {
            return iota.prepareTransfers(senderSeed, transfers)
                .then(trytes => {
                    trytesToSave = trytes;
                    return iota.sendTrytes(trytes, depth, minWeightMagnitude)
                })
                .then(bundle => {
                    console.log(`Published transaction with tail hash: ${bundle[0].hash}`)
                    console.log(`Bundle: ${JSON.stringify(bundle, null, 1)}`)
                    return trytesToSave;
                })
                .catch(err => {
                    console.log(err);
                    // handle errors here
                });
        }
    );
}


module.exports = { sendTransaction };
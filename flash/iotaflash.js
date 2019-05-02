/**
 * mostly
 * @author Iota Ledger <https://github.com/iotaledger/>
 */
const glob = require('./globalvariables')

const IOTACrypto = require('iota.crypto.js')
const transfer = require('./transfer')
const multisig = require('./multisig')
const Helpers = require('./functions')

/// ///////////////////////////////
// INITAL FLASH OBJECTS

// USER ONE - Initial Flash Object
function returnEVFlash() {
  return {
    userIndex: 0,
    userSeed: glob.evSeed,
    index: 0,
    security: glob.SECURITY,
    depth: glob.TREE_DEPTH,
    bundles: [],
    partialDigests: [],
    flash: {
      signersCount: glob.SIGNERS_COUNT,
      balance: glob.CHANNEL_BALANCE,
      deposit: glob.DEPOSITS.slice(), // Clone correctly
      outputs: {},
      transfers: []
    }
  }
}


/// ///////////////////////////////
// USER TWO - Initial Flash Object
function returnCSFlash() {
  return {
    userIndex: 1,
    userSeed: glob.csSeed,
    index: 0,
    security: glob.SECURITY,
    depth: glob.TREE_DEPTH,
    bundles: [],
    partialDigests: [],
    flash: {
      signersCount: glob.SIGNERS_COUNT,
      balance: glob.CHANNEL_BALANCE,
      deposit: glob.DEPOSITS.slice(), // Clone correctly
      outputs: {},
      transfers: []
    }
  }
}


console.log('Flash objects created!')

/// ///////////////////////////
/// ///  SETUP CHANNEL   //////

/// ///////////////////////////
// GENERATE DIGESTS

// USER ONE
// Create digests for the start of the channel
function returnEVDigest(one) {
  var oneFlash = one;

  for (let i = 0; i < glob.TREE_DEPTH + 1; i++) {
    // Create new digest
    const digest = multisig.getDigest(
      oneFlash.userSeed,
      oneFlash.index,
      oneFlash.security
    )
    // Increment key index
    oneFlash.index++
    oneFlash.partialDigests.push(digest)
  }
  return oneFlash
}

// USER TWO
// Create digests for the start of the channel
function returnCSDigest(two) {
  var twoFlash = two

  for (let i = 0; i < glob.TREE_DEPTH + 1; i++) {
    // Create new digest
    const digest = multisig.getDigest(
      twoFlash.userSeed,
      twoFlash.index,
      twoFlash.security
    )
    // Increment key index
    twoFlash.index++
    twoFlash.partialDigests.push(digest)
  }
  return twoFlash
}

/// ///////////////////////////////
// INITAL MULTISIG

function returnEVMultisignature(one, arr) {
  var oneFlash = one
  result_final = {}

  oneFlash.partialDigests.map((digest, index) => {
    // Create address
    let result = multisig.composeAddress(
      arr.map(userDigests => userDigests[index])
    )
    // Add key index in
    result.index = digest.index
    // Add the signing index to the object IMPORTANT
    result.signingIndex = oneFlash.userIndex * digest.security
    // Get the sum of all digest security to get address security sum
    result.securitySum = arr
      .map(userDigests => userDigests[index])
      .reduce((acc, v) => acc + v.security, 0)
    // Add Security
    result.security = digest.security
    result_final = result
  })
  return result_final
}

function returnCSMultisignature(two, arr) {
  var twoFlash = two
  result_final = {}

  twoFlash.partialDigests.map((digest, index) => {
    // Create address
    let result = multisig.composeAddress(
      arr.map(userDigests => userDigests[index])
    )
    // Add key index in
    result.index = digest.index
    // Add the signing index to the object IMPORTANT
    result.signingIndex = twoFlash.userIndex * digest.security
    // Get the sum of all digest security to get address security sum
    result.securitySum = arr
      .map(userDigests => userDigests[index])
      .reduce((acc, v) => acc + v.security, 0)
    // Add Security
    result.security = digest.security
    result_final = result
  })
  return result_final
}

/// ///////////////////////////
/// ///   TRANSACTING   //////

/// ///////////////////////////
// COMPOSE TX from USER ONE
function initiateTransaction(one, two) {
  let transfers = [{ value: 1, address: glob.twoSettlement }]

  // create Tx
  let bundles = Helpers.createTransaction(one, transfers, false)

  /// //////////////////////////////
  /// SIGN BUNDLES
  let oneSignatures = Helpers.signTransaction(one, bundles)
  let twoSignatures = Helpers.signTransaction(two, bundles)

  // Sign bundle with your ignatures
  let signedBundles = transfer.appliedSignatures(bundles, oneSignatures)
  signedBundles = transfer.appliedSignatures(signedBundles, twoSignatures)

  return signedBundles
};

function closeChannel(one, two) {
  oneFlash = one
  twoFlash = two

  // Supplying the CORRECT varibles to create a closing bundle
  bundles = Helpers.createTransaction(
    oneFlash,
    oneFlash.flash.settlementAddresses,
    true
  )

  /// //////////////////////////////
  /// SIGN BUNDLES

  // Get signatures for the bundles
  oneSignatures = Helpers.signTransaction(oneFlash, bundles)

  // Generate USER TWO'S Singatures
  twoSignatures = Helpers.signTransaction(twoFlash, bundles)

  // Sign bundle with your USER ONE'S signatures
  signedBundles = transfer.appliedSignatures(bundles, oneSignatures)

  // ADD USER TWOS'S signatures to the partially signed bundles
  signedBundles = transfer.appliedSignatures(signedBundles, twoSignatures)

  /// //////////////////////////////
  /// APPLY SIGNED BUNDLES

  // Apply transfers to User ONE
  oneFlash = Helpers.applyTransfers(oneFlash, signedBundles)
  // Save latest channel bundles
  oneFlash.bundles = signedBundles

  // Apply transfers to User TWO
  twoFlash = Helpers.applyTransfers(twoFlash, signedBundles)
  // Save latest channel bundles
  twoFlash.bundles = signedBundles

  console.log('Channel Closed')
  console.log('Final Bundle to be attached: ')
  console.log(signedBundles[0])

  return signedBundles[0]
}

/// ///////////////////////////
// CLOSE Channel

module.exports = {
  returnEVDigest,
  returnCSDigest,
  returnEVMultisignature,
  returnCSMultisignature,
  'initiateTransaction': initiateTransaction,
  'closeChannel': closeChannel,
  returnCSFlash,
  returnEVFlash
}

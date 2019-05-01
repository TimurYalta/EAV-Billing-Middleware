const iotaLib=require('@iota/core');
const seed1 = 'CEIICGPQVLAVY9USHMQULZYLGIPXFTWVOWXSOJNMGIBIRBSCOTPVIVITIXPAGTGVKXBXJJLQVUIHUACQA';
const seed2 ='OS9FEYYEEJQYCUNWWLAPAJHEK9YGBVQDNUYIQ9PDYUANGSTSX9KBSCNVA9DCUKGTBEIK9ZGWAGBWANZFZ';

const transaction = require('./iota/transaction');
const iota =iotaLib.composeAPI({
    provider:'https://iotanode.us:443'
});

// let trytes;

transaction.sendTransaction(seed2, seed1,20,'','final Test')
.then(res=>console.log(res));

// const newAddress = iota.getNewAddress(seed2,  (error, success) => {
//     if(error){
//             console.log('e')
//             console.log(error)
//     }else {
//             console.log('s')
//             console.log(success)
//     }
// });
// console.log(iota)
// const getNewAddress =iotaLib.createGetNewAddress('https://iotanode.us:443');
// const a =iota.getNewAddress(seed2).then((s)=>console.log(s)).catch(console.log);
// console.log(a)
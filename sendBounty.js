const fs = require('fs');
const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const helper = require('./helper');
const csv = require('csvtojson');
require('dotenv').config();


const config = {
  web3Url: process.env.WEB3_URL, //ujGcHij7xZIyz2afx4h2 AqW79dWnJH7UkG7wlcbB
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),
  csvPath: './input.csv',
  tokenContractAddress: process.env.TOKEN,
  privateKey: process.env.PK,
  gas: '90000',
  gasPrice: process.env.GAS_PRICE,
};

if (process.env.RPC_TYPE == 'ws') {
    const web3 = new Web3.providers.WebsocketProvider(config.rpc.address)
} else {
    const web3 = new web3Lib(config.web3Url);
}
const account = web3.eth.accounts.privateKeyToAccount(config.privateKey);
const tokenContract = new helper.Contract(web3, account, config.newAbi, config.tokenContractAddress);
const balances = {};
const addresses = [];
let transactions = [];

csv().fromFile(config.csvPath).on('csv', (csvRow)=>{
  addresses.push({account: csvRow[1], amount: parseInt(csvRow[0], 10)});
});

const sendTokens = async (addresses) => {
  let nonce = parseInt(await web3.eth.getTransactionCount(account.address, 'pending'), 10);
  for(let address of addresses) {
    const txHash = tokenContract.executeMethod({
      name: 'transfer',
      gas: config.gas,
      gasPrice: config.gasPrice,
      arguments: [address.account, address.amount * 10 ** 18],
      nonce: nonce
    })
    .then((txHash) => {
      console.log("Tx hash: ", txHash);
      transactions.push(txHash);
      fs.appendFileSync('processed.txt', txHash + "\n");
      waitTransaction(address, txHash);
    })
    .catch((err) => {
      console.log("Fail: ", address.account);
      fs.appendFileSync('failed.txt', address.amount + "," + address.account + "\n");
    });
    nonce++;
  }
};

const waitTransaction = async (address, transaction) => {
    console.log("Transaction: ", transaction);
    console.log('Wait transaction', transaction);
    await helper.waitTransaction(web3, transaction, 2400);
    console.log('Confirmed!');
    fs.appendFileSync('confirmed.txt', address.amount + "," + address.account + "\n");
};

setTimeout(() => {
  sendTokens(addresses);
}, 5000);

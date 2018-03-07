const fs = require('fs');
const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const helper = require('./helper');
const csv = require('csvtojson');

const config = {
  web3httpUrl: 'https://mainnet.infura.io/AqW79dWnJH7UkG7wlcbB',
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),
  csvPath: './input.csv',
  tokenContractAddress: '0x5ab14c104ba2771fd2a6ec6f616da1ad41d5b8a7',
  privateKey: '',
  gas: '90000',
  gasPrice: '4',
};

const web3 = new web3Lib(config.web3httpUrl);
const account = web3.eth.accounts.privateKeyToAccount(config.privateKey);
const tokenContract = new helper.Contract(web3, account, config.newAbi, config.tokenContractAddress);
const balances = {};
const addresses = [];

let totalTokensToSend = 0;
csv().fromFile(config.csvPath).on('csv', (csvRow)=>{
  addresses.push({account: csvRow[1], amount: parseInt(csvRow[0], 10)});
  totalTokensToSend += parseInt(csvRow[0], 10);
});

const sendTokens = async (addresses) => {
  let transactions = [];
  for(let address of addresses) {
    let nonce = await web3.eth.getTransactionCount(account.address, 'pending');
    const txHash = await tokenContract.executeMethod({
      name: 'transfer',
      gas: config.gas,
      gasPrice: config.gasPrice,
      arguments: [address.account, address.amount * 10 ** 18],
      nonce: nonce
    });
    transactions.push(txHash);
    fs.appendFileSync('processed.txt', txHash + "\n");

    console.log('Wait transaction', txHash);
    await helper.waitTransaction(web3, txHash, 240);
    console.log('Confirmed!');
    fs.appendFileSync('confirmed.txt', address.amount + "," + address.account + "\n");
  }
};

setTimeout(() => {
  sendTokens(addresses);
}, 5000);

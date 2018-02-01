const fs = require('fs');
const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const helper = require('./helper');
const csv = require('csvtojson');

const config = {
  web3httpUrl: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2',
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),
  csvPath: './input.csv',
  tokenContractAddress: '0x1a164bd1a4bd6f26726dba43972a91b20e7d93be',
  privateKey: '0x3244d69a1f78c29dfe094bdca9fab39cb18b3bae6307020e840089b4a38bedfe',
  gas: '238850',
  gasPrice: '4',
};

const web3 = new web3Lib(config.web3httpUrl);
const account = web3.eth.accounts.privateKeyToAccount(config.privateKey);
const tokenContract = new helper.Contract(web3, account, config.newAbi, config.tokenContractAddress);
const balances = {};
const addresses = [];

csv().fromFile(config.csvPath).on('csv', (csvRow)=>{
  console.log("Got row: ", csvRow);
  addresses.push({account: csvRow[0], amount: csvRow[1]});
});


const sendTokens = async (addresses) => {
  for(let address of addresses) {
    const txHash = await tokenContract.executeMethod({
      name: 'transfer',
      gas: config.gas,
      gasPrice: config.gasPrice,
      arguments: [address.account, address.amount]
    });
    console.log('Wait transaction', txHash);
    await helper.waitTransaction(web3, txHash, 240);
    console.log('Confirmed!');

    fs.appendFileSync('processed.txt', address.account + "\n");
  }
};

setTimeout(() => {
  sendTokens(addresses);
}, 5000);

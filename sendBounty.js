const fs = require('fs');
const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const helper = require('./helper');
const csv = require('csvtojson');

const config = {
  web3httpUrl: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2',
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),
  csvPath: './input.csv',
  tokenContractAddress: '',
  privateKey: '',
  gas: '238850',
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
  for(let address of addresses) {
    const txHash = await tokenContract.executeMethod({
      name: 'transfer',
      gas: config.gas,
      gasPrice: config.gasPrice,
      arguments: [address.account, address.amount * 10 ** 18]
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

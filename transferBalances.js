const fs = require('fs');
const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const helper = require('./helper');
require('dotenv').config();

const config = {
  web3httpUrl: 'https://mainnet.infura.io/ujGcHij7xZIyz2afx4h2',
  oldAbi: JSON.parse(fs.readFileSync('./std.abi')),
  oldContractAddress: process.env.TOKEN,//'0x9D613a7A10CD550C7a0826c6deEcFF6f1B3e9879',//'0xe4DAf254422A18cA4C1dE729F9bd35D79f6B7497', //Ignore txs
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),
  privateKey: process.env.PK,//'0x62ea9a34e1682fe0d87299531cf235499e8a5a045e1fea6ce1c19baeca3f0862',
  gas: '120000',
  gasPrice: process.env.GAS_PRICE,
  fromBlock: process.env.FROM_BLOCK
};

// if (config.oldContractAddress == config.newContractAddress) {
//   throw new Error('Contracts addresses are equals');
// }

const web3 = new web3Lib(config.web3httpUrl);
const account = web3.eth.accounts.privateKeyToAccount(config.privateKey);
const oldContract = new helper.Contract(web3, null, config.oldAbi, config.oldContractAddress);
const balances = {};

oldContract.getPastEvents('Transfer', config.fromBlock).then(async (eventResult) => {
  const BN = web3.utils.BN;

  for(e of eventResult) {
    const ev = e.returnValues;
    fs.appendFileSync('processed.txt', (ev._value / 10 ** 18) + "," + ev._to + "\n");
    if (typeof balances[ev._from] === 'undefined') {
      balances[ev._from] = new BN();
    }
    if (typeof balances[ev._to] === 'undefined') {
      balances[ev._to] = new BN();
    }
    balances[ev._from].isub(new BN(ev._value));
    balances[ev._to].iadd(new BN(ev._value));
  }

  for(b in balances) {
    if (b == account.address) {
      delete balances[b];
      continue;
    }
    if (b == config.oldContractAddress) {
      delete balances[b];
      continue;
    }
    balances[b] = web3.utils.numberToHex(balances[b]);
  }
}).then(async () => {
  console.log("Done!");
});

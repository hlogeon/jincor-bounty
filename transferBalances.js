const fs = require('fs');
const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const helper = require('./helper');

const config = {
  web3httpUrl: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2',
  oldAbi: JSON.parse(fs.readFileSync('./std.abi')),
  oldContractAddress: '0x1a164bd1a4bd6f26726dba43972a91b20e7d93be',
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),
  newContractAddress: '0x3210e0c3d1e51dd0b41739b2933a0ee33a528142',
  privateKey: '0x3244d69a1f78c29dfe094bdca9fab39cb18b3bae6307020e840089b4a38bedfe',
  gas: '50000',
  gasPrice: '10',
  fromBlock: 0
};

if (config.oldContractAddress == config.newContractAddress) {
  throw new Error('Contracts addresses are equals');
}

const web3 = new web3Lib(config.web3httpUrl);
const account = web3.eth.accounts.privateKeyToAccount(config.privateKey);
const oldContract = new helper.Contract(web3, null, config.oldAbi, config.oldContractAddress);
const newContract = new helper.Contract(web3, account, config.newAbi, config.newContractAddress);
const balances = {};

fs.appendFileSync('processed.txt', '');

oldContract.getPastEvents('Transfer', config.fromBlock).then((eventResult) => {
  const BN = web3.utils.BN;

  for(e of eventResult) {
    const ev = e.returnValues;
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
    balances[b] = web3.utils.numberToHex(balances[b]);
  }
  fs.readFileSync('processed.txt').toString().split('\n').forEach(b => {
    if (balances[b]) {
      delete balances[b];
    }
  });
}).then(async () => {
  let processedCounts = 0;
  console.log('Try to process:', JSON.stringify(balances, null, '  '));
  for(b in balances) {
    console.log('-->', processedCounts + 1, b, balances[b]);
    processedCounts++;
    try {
      const txHash = await newContract.executeMethod({
        name: 'transfer',
        gas: config.gas,
        gasPrice: config.gasPrice,
        arguments: [b, balances[b]]
      });
      console.log('Wait transaction', txHash);
      await helper.waitTransaction(web3, txHash, 240);
      console.log('Confirmed!');

      fs.appendFileSync('processed.txt', b + "\n");
    } catch (e) {
      throw e;
    }
  }
  if (!processedCounts) {
    console.log('Nothing was processed');
  } else {
    console.log('Wait event loop completence...');
  }
});

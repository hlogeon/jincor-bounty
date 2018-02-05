const fs = require('fs');
const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const helper = require('./helper');

const config = {
  web3httpUrl: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2',
  oldAbi: JSON.parse(fs.readFileSync('./std.abi')),
  oldContractAddress: '0x1a164bd1a4bd6f26726dba43972a91b20e7d93be', //Ignore txs
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),
  newContractAddress: '0x3210e0c3d1e51dd0b41739b2933a0ee33a528142',
  privateKey: '0x3244d69a1f78c29dfe094bdca9fab39cb18b3bae6307020e840089b4a38bedfe',
  gas: '50000',
  gasPrice: '10',
  fromBlock: 0
};

const duplicateTransactions = [
'0x9ea908cd5c77e8c1800392b585b6480920f57a05ed4a29842b900d7f14d8abd5', '0xb92690dc9131ee7ea4214c4f10e365461f0b1621755eb27f4345eeffe3346749',
'0x8ac562f4b118815616e4942b2d1c97b5042e461aa8dcca72216b313745ef6d8e', '0xa4302306cb973ba92c9b5da0dceb6779408309ba112ea83c0873ea25b06c4882',
'0xc37c7e748e48e80c1461e3712a2491f71227df28fd38b11ab888589e66bae175','0xafd8d44bf36badb9f76846fb7a1fa8df810d532f520681df0c0582947378bcdf',
'0x62c240a004d47750d80b281bad67d2fbde7c55db0d1f2bc82b3af1b458611a39','0xea046e4228caba851b539613c88535b1665c9a9ad1c5b6a0f1bcaf9ba805f12d',
'0x888f0e35ca33466be6de1406bea8bbbeb13286e7c4b695233331b2519e646c0e','0x7928280373f141604f5533caf99b8bb04d6fe57cf67fc16c50b5b349a47a0f61',
'0xd3d7b23d9d9340464de7aa55a40808f6c34e0fae54f6ae26cea5e00a864790c7','0x0680677b18c895201b28447020dd71ba28c97dd4b77adef5b4d86036306266e8'
'0x611f883560a2c583af984d028f4ca9f2cb0cd3390970f8740939cb564246936e'



// '0x4e05c2b507266a40036c56d48427bca4a47897425959e646c99d10d2bb8a5e51',
// '0x32c506cf0ae78fb5cb36953b670aff5373fe4a9a309d093786a42cbf7a1b6a1a',
// '0xc394b3e475e2d4f9b4cc0fcbbca1ff0b4fe802afed64ca88ffda19ccc7c13fab'
];

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
    console.log("tx: ", e.transactionHash);
    const ev = e.returnValues;
    if(duplicateTransactions.indexOf(e.transactionHash) !== -1) {
      console.log("Duplicate tx: ", duplicateTransactions[duplicateTransactions.indexOf(e.transactionHash)]);
      continue;
    }
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

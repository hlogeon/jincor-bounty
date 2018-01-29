// const config = {
//   web3httpUrl: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2',
//   contractAddress: '0x2cd05b2e7165c12b927df4af60f8ebf26d4e20ca',
//   abi: JSON.parse(require('fs').readFileSync('./contract.abi')),
//   wallet: '0x81c51b9c45D38f3AAB102a430D8aDFFF0523dCFe',
//   privateKey: '0xfb08bbaefcf9f5e26f568ef3aa05f92203efdc8c640c04eaa15940372133f061',
//   query: false,
//   method: 'transfer',
//   batchArgs: JSON.parse(require('fs').readFileSync('./transfer.json')),
//   waitTransaction: true,
//   gas: '200',
//   gasPrice: '100',
//   startBlock: 0,
// };

const web3Lib = require('web3');
const web3Utils = require('web3-utils');
const ContractWatcher = require('@digicat/ethereum-contract-watcher');

const config = {
  web3httpUrl: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2',
  contractAddress: '0x9D613a7A10CD550C7a0826c6deEcFF6f1B3e9879',
  abi: JSON.parse(require('fs').readFileSync('./token.abi')),
  wallet: '0x81c51b9c45D38f3AAB102a430D8aDFFF0523dCFe',
  privateKey: '0xfb08bbaefcf9f5e26f568ef3aa05f92203efdc8c640c04eaa15940372133f061',
  method: 'mintFish',
  batchArgs: JSON.parse(require('fs').readFileSync('./out1.json')),
  gas: 5000000,
  gasPrice: '21'
};
const web3 = new web3Lib(config.web3httpUrl);

const watcher = new ContractWatcher({
  ethereumNode: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2',

  onError (err, token) {
    // Called when an error occurred. Expected to be synchronous.
  },

  onEvent (event, token) {
    console.log(event);
  },

  wrapWeb3Error (err) {
    // Allows for underlying Web3 errors to be wrapped in another Error class.
    // By default returns the error as-is.
    return err
  }
});

// Start watching a new contract. The `token` is provided in callbacks as-is.
watcher.add({
  // ABI array of the contract (required).
  abi: config.abi,
  // Contract address (required, no default value).
  address: config.contractAddress,
  // The block from which events should be observed. Defaults to 'latest'.
  fromBlock: '0',
  token: {
    an: {
      arbitrary: 'object'
    }
  }
})


function sufficientBalance(input) {
  return new Promise((resolve, reject) => {
    web3.eth.getBalance(input.from)
      .then((balance) => {
        const BN = web3.utils.BN;
        const txFee = new BN(input.gas).mul(new BN(web3.utils.toWei(input.gasPrice, 'gwei')));
        const total = new BN(web3.utils.toWei(input.amount)).add(txFee);
        console.log('Sufficient balance',
          web3.utils.fromWei(txFee).toString(),
          web3.utils.fromWei(total).toString(),
          web3.utils.fromWei(new BN(balance)).toString()
        );
        resolve(total.lte(new BN(balance)));
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function sendTransaction(input) {
  const params = {
    value: web3Utils.toWei(input.amount.toString()),
    from: input.from,
    to: input.to,
    gas: input.gas,
    gasPrice: web3Utils.toWei(input.gasPrice, 'gwei'),
    data: input.data
  };

  return new Promise((resolve, reject) => {
    sufficientBalance(input).then((sufficient) => {
      if (!sufficient) {
        reject({
          message: 'Insufficient funds to perform this operation and pay tx fee'
        });
      }

      web3.eth.accounts.signTransaction(params, config.privateKey).then(transaction => {
        let txHash = '?';
        let confirmationCount = 0;
        web3.eth.sendSignedTransaction(transaction.rawTransaction)
          .on('transactionHash', transactionHash => {
            console.log('Transaction is', txHash = transactionHash);
          })
          .on('receipt', (receipt) => {
            console.log('Got receipt for', txHash, receipt && receipt.status);
            if (receipt) {
              if (receipt.status == 1) {
                console.log('Confirmed', txHash);
                resolve(txHash);
              } else {
                console.error('Failed', txHash);
                reject(txHash);
              }
            }
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            confirmationCount = confirmationNumber;
            if (confirmationCount == 12) {
              console.log('Confirmed', txHash);
              resolve(txHash);
            }
          })
          .on('error', (error) => {
            console.error('ERROR: on error sendSignedTransaction', error);
            reject(error);
          })
          .catch((error) => {
            console.error('ERROR: catch error sendSignedTransaction', error);
            reject(error);
          });
      });
    });
  });
}

function transpose(rows) {
  let columns = {};
  Object.keys(rows[0]).forEach(c => {
    columns[c] = rows.map(r => r[c]);
  });
  return columns;
}

class Contract {
  constructor(abi, addr) {
    this.startBlock = 0;
    this.abi = abi;
    this.addr = addr;
    this.contract = new web3.eth.Contract(abi, addr);
  }

  contractExecuteMethod(input) {
    const contractMethod = this.contract.methods[input.methodName];
    const method = contractMethod.apply(contractMethod, input.arguments);

    return method.estimateGas({ from: input.from }).then((estimatedGas) => {
      estimatedGas += config.gas;
      const txInput = {
        from: input.from,
        to: this.addr,
        amount: input.amount,
        gas: estimatedGas,
        gasPrice: input.gasPrice,
        data: method.encodeABI()
      };
      console.log('Estimated gas', estimatedGas);
      return sendTransaction(txInput, input.salt);
    });
  }

  contractQueryMethod(input) {
    const contractMethod = this.contract.methods[input.methodName];
    const method = contractMethod.call(contractMethod, input.arguments);
    return method.call();
  }
}

console.log('Run');

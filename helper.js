const web3Lib = require('web3');
const web3Utils = require('web3-utils');

module.exports.sendTransaction = sendTransaction;
async function sendTransaction(web3, account, input) {
  let nonce = await web3.eth.getTransactionCount(account.address, 'pending');
  const params = {
    to: input.to,
    value: web3Utils.toWei(input.amount.toString()),
    gas: input.gas,
    gasPrice: web3Utils.toWei(input.gasPrice, 'gwei'),
    data: input.data,
    nonce: nonce
  };


  return new Promise((resolve, reject) => {
    account.signTransaction(params).then(transaction => {
      web3.eth.sendSignedTransaction(transaction.rawTransaction)
        .on('transactionHash', transactionHash => {
          console.log('Transaction is', transactionHash);
          resolve(transactionHash);
        })
        .on('receipt', (receipt) => {
          console.log('Got receipt for', txHash, receipt && receipt.status);
          if (receipt && receipt.status == 0) {
            console.error('Failed', txHash);
            reject(txHash);
          }
        })
        .on('error', (error) => {
          reject(error);
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
}

module.exports.waitTransaction = function waitTransaction(web3, txHash, maxAttempts) {
  if (!txHash) {
    throw new Error('No txHash was passed');
  }
  maxAttempts = maxAttempts || 120;

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkTransaction = () => {
      attempts++;
      if (attempts > maxAttempts) {
        reject('Transaction was not mined after ${maxAttempts} seconds, please make sure your transaction was properly send. Be aware that it might still be mined!');
      }
      setTimeout(() => {
        console.log('Check transaction status', attempts, '/', maxAttempts);
        web3.eth.getTransactionReceipt(txHash).then((tx) => {
          if (!tx) {
            return checkTransaction();
          }
          if (tx.status == 0) {
            return reject('Failed');
          }
          resolve(tx);
        }, (e) => {
          reject(e);
        });
      }, 1000);
    };
    checkTransaction();
  });
}

module.exports.Contract = class Contract {
  constructor(web3, account, abi, addr) {
    this.web3 = web3;
    this.abi = abi;
    this.addr = addr;
    this.account = account;
    this.contract = new this.web3.eth.Contract(abi, addr);
  }

  executeMethod(input) {
    const contractMethod = this.contract.methods[input.name];
    const method = contractMethod.apply(contractMethod, input.arguments);

    return (input.gas ? Promise.resolve(input.gas) : method.estimateGas({ from: input.from })).then((estimatedGas) => {
      // let nonce = await this.web3.eth.getTransactionCount(this.account.address, 'pending');
      const txInput = {
        to: this.addr,
        amount: input.amount || '0',
        gas: estimatedGas || '0',
        gasPrice: input.gasPrice || '0',
        data: method.encodeABI(),
        nonce: input.nonce
      };
      console.log('Estimated gas', estimatedGas);
      return sendTransaction(this.web3, this.account, txInput);
    });
  }

  queryMethod(input) {
    const contractMethod = this.contract.methods[input.methodName];
    const method = contractMethod.call(contractMethod, input.arguments);
    return method.call();
  }

  getPastEvents(name, fromBlock) {
    return this.contract.getPastEvents(name, { fromBlock });
  }
}

# Jincor bounty sender


This is the script I used to send the tokens earned by bounty hunters during Jincor
ICO campaign. The script can be also used for token airdrops.

# Installation


To install the environment all you need to do is to run `npm i`

# Configure


In order to Configure the script simply open `./sendBounty.js` file and modify
the following lines:

```
const config = {
  web3httpUrl: 'https://ropsten.infura.io/ujGcHij7xZIyz2afx4h2', // HTTP url of web3 node
  newAbi: JSON.parse(fs.readFileSync('./std.abi')), //token contract ABI
  csvPath: './input.csv', //path to input csv file
  tokenContractAddress: '', //address of token smart-contract
  privateKey: '', //privateKey of sender account
  gas: '238850', //gas limit
  gasPrice: '4', //gas price
};
```


In order to specify the addresses and  amount of tokens to send simply modify `input.csv`

# RUN

`npm run bounty`

# FinTab Tokens

Baked with <3 by [JincorTech](https://github.com/JincorTech/)

## FNTB token functionality
FinTab is the Accounting System for Cryptocurrency Portfolios for funds, traders and investors. The project is currently at the ICO stage. FinTab asked to help them with issuance of the new tokens, adding some advanced functionality, sending the new tokens to the old token holders. Additionally they asked to reissue their ERC20 tokens and some advanced functionality like the following:

1. Bancor Token Protocol compatibility
2. ERC223 standard support
3. Token freeze functionality to disable token transfers for the team until the day X comes

In addition to the token changes, we need to implement new functionality like the following:

1. Bancor Exchange Protocol compatible contract
2. Token burner which accepts the token, burn one part (90%) and sends another part to team wallet
![Fintab token burner](https://fintab.io/img/sm-en2.png?v=3)


## Challenges
The token contract is pretty complicated by the nature because it's built on top of multiple controversial standards which functionality is usually intersects. The most challenging part about this token is to make it easy to read, understand, mainttain and not too expensive in terms of gas usage. Do not loose the benefits from the standards.

The Burner contract is much more complicated in terms of business rules and logic. In one hand, it should provide a way to  set up the token\usd rate manually. But  in the other hand, we have a requirement to update this price automatically from the exchanges when token hits the market. We should be able to set up at least to plans for users who burn the tokens. Calculate the change and return it to the user.

### Deadlines
We had 5 business days to implement this and this repository contains the result

## Architecture
![Contract diagram](https://monosnap.com/file/o95vLYEmtyKG5sfLIicUlzsx5QMMv9.png)

### FinTabToken
FinTabToken is a complicated contract as it unites many standards at once. The main problem of adopting multiple standards
is that they usually do the same things in a different way like `Ownable` vs `Ownership` and `ownerOnly` vs `onlyOwner`. This makes it really hard to keep things consistent in this case.

### TokenBurner
Token burner contract is aimed to implement business logic where user send ERC223-token to a contract. Contracts calculates the
plan by the amount of tokens sent, price of the token using the  PriceProvider. If user sends less then the cheapest plan it rejects the transaction. If user sends more then needed contract sends the change back to the user. 90% of received tokens will be burned and 10% will be sent to the team address.

## PriceProvider
I also added PriceProvider interface and basic implementation of ManualPriceProvider. We use PriceProvider interface in the TokenBurner contract to provide an ability to update the prices and change implementations even after TokenBurner deployment.
ManualPriceProvider - the basic implementation of PriceProvider interface, allows an owner to set the price manually and notifies watcher abot the changes.


## transferBalances.js
Because of the fact that this token is a replacement for an active and deployed ERC20-token, we need a way to
send all current token holders the same amounts of the new token. In order to do this, we prepared a small script which is easy to use and configure.

Configuration for the script is located at `/transferBalances.js` and looks like the one bellow:

```
const config = {
  web3httpUrl: 'https://ropsten.infura.io/infuraAPIKey',
  oldAbi: JSON.parse(fs.readFileSync('./std.abi')), // Old token Contract ABI
  oldContractAddress: '0x1a164bd1a4bd6f26726dba43972a91b20e7d93be', // Old contract
  newAbi: JSON.parse(fs.readFileSync('./std.abi')), / /New token Contract ABI
  newContractAddress: '0x3210e0c3d1e51dd0b41739b2933a0ee33a528142', // New token contract address
  privateKey: '0x0', // Private key of the owner of new token to sign transactions
  gas: '50000', // Gas Limit
  gasPrice: '10', // Gas price
  fromBlock: 0 // Starting block
};
```

It just looking for `Transfer` events starting from block `config.fromBlock` on the old contract and sends the  same amount of new token when found.

How to run: `docker-compose exec workspace node ./transferBalances.js`. *Make sure you configured the script before running*

## ./sendBounty.js
Customer ask to add a script to send the reward for bounty campaign. This script is looking for `input.csv` file and loads account addresses and amounts of tokens to send and then sends them, signing by private key provided.
Configuration looks pretty much like `transferBalances.js` config.

```
const config = {
  web3httpUrl: 'https://ropsten.infura.io/infuraAPIKey', //ethereum node connection string
  newAbi: JSON.parse(fs.readFileSync('./std.abi')),  //abi of the token
  csvPath: './input.csv', //path to csv file
  tokenContractAddress: '0x1a164bd1a4bd6f26726dba43972a91b20e7d93be', //address of token we are going to send
  privateKey: '0x3244d69a1f78c29dfe094bdca9fab39cb18b3bae6307020e840089b4a38bedfe', //Private key of the account we are sending tokens from
  gas: '238850', //limit of gas to be used
  gasPrice: '4', //gas price
};
```
How to run: `docker-compose exec workspace node ./sendBounty.js`


## How to setup development environment and run tests?

1. Install `docker` if you don't have it.
1. Clone this repo.
1. Run `docker-compose build --no-cache`.
1. Run `docker-compose up -d`.
1. Install dependencies: `docker-compose exec workspace yarn`.
1. To run tests: `docker-compose exec workspace truffle test`.
1. To merge your contracts via sol-merger run: `docker-compose exec workspace yarn merge`.
Merged contracts will appear in `merge` directory.

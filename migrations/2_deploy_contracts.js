const FinTabToken = artifacts.require("FinTabToken.sol");
const TokenBurner = artifacts.require("TokenBurner.sol");

module.exports = async (deployer, accounts) => {
    await deployer.deploy(FinTabToken);
    await deployer.deploy(TokenBurner, FinTabToken.address, accounts[0]);
};

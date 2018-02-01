const FinTabToken = artifacts.require("FinTabToken.sol");
const TokenBurner = artifacts.require("TokenBurner.sol");
const ManualPriceProvider = artifacts.require("ManualPriceProvider.sol");

module.exports = async (deployer, accounts) => {
    // await deployer.deploy(FinTabToken);
    // await deployer.deploy(TokenBurner, FinTabToken.address, accounts[0]);
    // await deployer.deploy(ManualPriceProvider, TokenBurner.address);
    // TokenBurner.setPriceProvider(ManualPriceProvider.address);
};

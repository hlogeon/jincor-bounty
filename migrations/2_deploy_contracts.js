const FinTabToken = artifacts.require("FinTabToken.sol");
const TokenBurner = artifacts.require("TokenBurner.sol");
const ManualPriceProvider = artifacts.require("ManualPriceProvider.sol");

module.exports = async (deployer, accounts) => {
    await deployer.deploy(FinTabToken, 5860000);
    await deployer.deploy(TokenBurner, FinTabToken.address, accounts[0]);
    FinTabToken.setBurner(TokenBurner.address);
    await deployer.deploy(ManualPriceProvider, TokenBurner.address);
    TokenBurner.setPriceProvider(ManualPriceProvider.address);
};

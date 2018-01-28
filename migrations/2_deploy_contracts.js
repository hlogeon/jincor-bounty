const FinTabToken = artifacts.require("FinTabToken.sol");

module.exports = async (deployer) => {
    await deployer.deploy(FinTabToken);
};

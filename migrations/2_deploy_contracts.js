var FinTabToken = artifacts.require("./FinTabToken.sol");

module.exports = function(deployer) {
  deployer.deploy(FinTabToken);
};

const ManualPriceProvider = artifacts.require("ManualPriceProvider");
const FinTabToken = artifacts.require("FinTabToken");
const TokenBurner = artifacts.require("TokenBurner");
const assertJump = require("zeppelin-solidity/test/helpers/assertJump.js");

contract('TokenBurner', function (accounts) {
  beforeEach(async function () {
    this.token = await FinTabToken.new('0');
    this.tokenBurner = await TokenBurner.new(this.token.address, accounts[1]);
    await this.token.setBurner(this.tokenBurner.address, true);
    this.manualPriceProvider = await ManualPriceProvider.new(this.tokenBurner.address);
    await this.tokenBurner.setPriceProvider(this.manualPriceProvider.address);
    await this.manualPriceProvider.setPrice(25);
  });

  it('should burn 90% of tokens', async function () {
      let totalSupply = (await this.token.totalSupply());
      totalSupply -= (4750000000/100) * 90;
      await this.token.transfer(this.tokenBurner.address, 4750000000);
      assert.equal(totalSupply, (await this.token.totalSupply()));
  });

  it('should send 10% tokens the team wallet', async function () {
    await this.token.transfer(this.tokenBurner.address, 4750000000);
    assert.equal(475000000, (await this.token.balanceOf(accounts[1])));
  });

  it('should calculate rates and change correctly', async function () {
    await this.token.transfer(this.tokenBurner.address, 4950000000);
    assert.equal(475000000, (await this.token.balanceOf(accounts[1])));
  });

});

const ManualPriceProvider = artifacts.require("ManualPriceProvider");
const FinTabToken = artifacts.require("FinTabToken");
const TokenBurner = artifacts.require("TokenBurner");
const assertJump = require("zeppelin-solidity/test/helpers/assertJump.js");

contract('ManualPriceProvider', function (accounts) {
  beforeEach(async function () {
    this.token = await FinTabToken.new();
    this.tokenBurner = await TokenBurner.new(this.token.address, accounts[0]);
    this.manualPriceProvider = await ManualPriceProvider.new(this.tokenBurner.address);
    await this.tokenBurner.setPriceProvider(this.manualPriceProvider.address);
  });

  it('should be created with active state', async function () {
    //enum - Stopped will be 0
    const state = (await this.manualPriceProvider.state()).toNumber();
    assert.equal(1, state);
  });

  it('should update price at receiver', async function () {
    //enum - Stopped will be 0
    await this.manualPriceProvider.setPrice(25);
    assert.equal(25, await this.manualPriceProvider.currentPrice());
    assert.equal(25, await this.tokenBurner.usdPrice());
  });


  it('should not allow to set watcher to 0x0', async function () {
    try {
      await this.manualPriceProvider.setWatcher(0x0, { from: accounts[0] });
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it('should not allow to call notify watcher directly', async function () {
    try {
      await this.manualPriceProvider.notifyWatcher({ from: accounts[0] });
    } catch (error) {
      return;
    }
    assert.fail('should have thrown before');
  });
});

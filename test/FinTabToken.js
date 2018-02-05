const FinTabToken = artifacts.require("FinTabToken");
const assertJump = function(error) {
    assert.isAbove(error.message.search('invalid opcode'), -2, 'Invalid opcode error must be returned');
};

contract('FinTabToken', function(accounts) {

  it("should put 5000000 FNTB to supply and in the first account", async function () {
    const instance = await FinTabToken.new('5860000');
    console.log("Token!", instance.address);
    const balance = await instance.balanceOf(accounts[0]);
    const supply = await instance.totalSupply();

    assert.equal(balance.valueOf(), 3079386683 * 10 ** 5, "First account (owner) balance must be 35000000");
    assert.equal(supply.valueOf(), 3079386683 * 10 ** 5, "Supply must be 35000000");
  });


  it("should allow to set teamAddresses by owner", async function () {
    const instance = await FinTabToken.new('5860000');

    await instance.setTeamAddress(accounts[1], true);
    const value = await instance.teamAddresses(accounts[1]);
    assert.equal(value, true)
  });

  it("should not allow transfer when token is not released and 'sender' is added to teamAddresses map", async function() {
    let token = await FinTabToken.new('5860000');
    try {
      await token.setTeamAddress(accounts[1], true);
      await token.teamAddresses();
      // console.log(await token.teamAddresses());
      await token.transfer(accounts[1], 100);
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should allow transfer when token is released", async function() {
    let token = await FinTabToken.new('0');
    await token.setTeamAddress(accounts[0], true);
    await token.transfer(accounts[1], 100 * 10 ** 8);
    const balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0.valueOf(), 3079286683 * 10 ** 5);

    const balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1.valueOf(), 100 * 10 ** 8);
  });

  it("should allow transfer when token is released - fractional value", async function() {
    let token = await FinTabToken.new('0');

    await token.transfer(accounts[1], 0.001 * 10 ** 8);

    const balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0.valueOf(), (3079386682 * 10 ** 5).toString());

    const balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1.valueOf(), (0.001 * 10 ** 8).toString());
  });

  it("should not allow transfer when token is not released but sender is added to teamAddresses", async function() {
    let token = await FinTabToken.new('5860000');

    await token.setTeamAddress(accounts[0], true);

    try {
      await token.transfer(accounts[1], 100 * 10 ** 8);
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should not allow transfer to 0x0", async function() {
    let token = await FinTabToken.new('5860000');

    await token.setTeamAddress(accounts[0], true);

    try {
      await token.transfer(0x0, 100 * 10 ** 8);
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should not allow transfer from to 0x0", async function() {
    let token = await FinTabToken.new('5860000');

    await token.setTeamAddress(accounts[0], true);
    await token.approve(accounts[1], 100 * 10 ** 8);

    try {
      await token.transferFrom(accounts[0], 0x0, 100 * 10 ** 8, {from: accounts[1]});
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should allow transferFrom when token is not released and 'from' is not added to teamAddresses map", async function() {
    let token = await FinTabToken.new('5860000');
    await token.approve(accounts[1], 100 * 10 ** 8);
    await token.transferFrom(accounts[0], accounts[2], 100 * 10 ** 8, {from: accounts[1]});
    assert.equal(await token.balanceOf(accounts[2]), 100 * 10 ** 8);


  });

  it("should allow transferFrom when token is released", async function() {
    let token = await FinTabToken.new('0');

    await token.approve(accounts[1], 100 * 10 ** 8);
    await token.transferFrom(accounts[0], accounts[2], 100 * 10 ** 8, {from: accounts[1]});

    const balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0.valueOf(), 3079286683 * 10 ** 5);

    const balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1.valueOf(), 100 * 10 ** 8);

    const balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2.valueOf(), 0);
  });


  it("should allow to burn by owner", async function() {
    let token = await FinTabToken.new('5860000');
    await token.burn(1000000 * 10 ** 8);

    const balance = await token.balanceOf(accounts[0]).valueOf();
    assert.equal(balance.valueOf(), 2079386683 * 10 ** 5);

    const supply = await token.totalSupply().valueOf();
    assert.equal(supply.valueOf(), 2079386683 * 10 ** 5);
  });

  it("should not allow to burn more than balance", async function() {
    let token = await FinTabToken.new('5860000');

    try {
      await token.burn(5000001 * 10 ** 8);
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should allow to burn from by owner", async function() {
    let token = await FinTabToken.new('5860000');
    await token.transfer(accounts[1], 1000000 * 10 ** 8);
    await token.approve(accounts[0], 500000 * 10 ** 8, {from: accounts[1]});
    await token.burnFrom(accounts[1], 500000 * 10 ** 8);

    const balance = await token.balanceOf(accounts[1]).valueOf();
    assert.equal(balance, 500000 * 10 ** 8);

    const supply = await token.totalSupply().valueOf();
    assert.equal(supply.valueOf(), 2579386683 * 10 ** 5);

    //should not allow to burn more
    try {
      await token.burnFrom(accounts[1], 1);
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should not allow to burn from by not owner", async function() {
    let token = await FinTabToken.new('5860000');
    await token.transfer(accounts[1], 1000000 * 10 ** 8);
    await token.approve(accounts[2], 500000 * 10 ** 8, {from: accounts[1]});

    try {
      await token.burnFrom(accounts[1], 500000 * 10 ** 8, {from: accounts[2]});
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it("should not allow to burn from more than balance", async function() {
    let token = await FinTabToken.new('5860000');
    await token.transfer(accounts[1], 500000 * 10 ** 8);
    await token.approve(accounts[0], 1000000 * 10 ** 8, {from: accounts[1]});

    try {
      await token.burnFrom(accounts[1], 500001 * 10 ** 8);
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });


  it('verifies that the owner can disable & re-enable transfers', async () => {
     let token = await FinTabToken.new('5860000');
     await token.disableTransfers(true);
     let transfersEnabled = await token.transfersEnabled();
     assert.equal(transfersEnabled, false);
     await token.disableTransfers(false);
     transfersEnabled = await token.transfersEnabled();
     assert.equal(transfersEnabled, true);
 });

 it('should throw when a non owner attempts to disable transfers', async () => {
       let token = await FinTabToken.new('5860000');
       try {
           await token.disableTransfers(true, { from: accounts[1] });
           assert(false, "didn't throw");
       }
       catch (error) {
           return assertJump(error);
       }
       assert.fail('should have thrown before');
   });

   it('verifies that issue tokens updates the target balance and the total supply', async () => {
       let token = await FinTabToken.new('5860000');
       await token.issue(accounts[1], 100);
       let totalSupply = await token.totalSupply();
       assert.equal(totalSupply, (3079386683 * 10 ** 5) + 100);
       let balance = await token.balanceOf(accounts[1]);
       assert.equal(balance, 100);
   });

   it('verifies that the owner can issue tokens', async () => {
       let token = await FinTabToken.new('5860000');
       await token.issue(accounts[1], 100);
       let balance = await token.balanceOf(accounts[1]);
       assert.equal(balance, 100);
   });

   it('verifies that the owner can issue tokens to his/her own account', async () => {
       let token = await FinTabToken.new('5860000');
       await token.issue(accounts[0], 100);
       let balance = await token.balanceOf.call(accounts[0]);
       assert.equal(balance, (3079386683 * 10 ** 5) +100);
   });

   it('should throw when the owner attempts to issue tokens to an invalid address', async () => {
       let token = await FinTabToken.new('5860000');

       try {
           await token.issue('0x0', 100);
           assert(false, "didn't throw");
       }
       catch (error) {
           return assertJump(error);
       }
       assert.fail('should have thrown before');
   });

   it('should throw when the owner attempts to issue tokens to the token address', async () => {
       let token = await FinTabToken.new('5860000');

       try {
           await token.issue(token.address, 100);
           assert(false, "didn't throw");
       }
       catch (error) {
         return assertJump(error);
       }
       assert.fail('should have thrown before');
   });

   it('should throw when a non owner attempts to issue tokens', async () => {
       let token = await FinTabToken.new('5860000');

       try {
           await token.issue(accounts[1], 100, { from: accounts[2] });
           assert(false, "didn't throw");
       }
       catch (error) {
         return assertJump(error);
       }
       assert.fail('should have thrown before');
   });


   it('verifies that destroy tokens updates the target balance and the total supply', async () => {
        let token = await FinTabToken.new('5860000');
        await token.issue(accounts[1], 100);
        await token.destroy(accounts[1], 20);
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply, (3079386683 * 10 ** 5) + 80);
        let balance = await token.balanceOf(accounts[1]);
        assert.equal(balance, 80);
    });

    it('verifies that the owner can destroy tokens', async () => {
        let token = await FinTabToken.new('5860000');
        await token.issue(accounts[1], 100);
        await token.destroy(accounts[1], 20);
        let balance = await token.balanceOf(accounts[1]);
        assert.equal(balance, 80);
    });

    it('verifies that the owner can destroy tokens from his/her own account', async () => {
        let token = await FinTabToken.new('5860000');
        await token.issue(accounts[0], 100);
        await token.destroy(accounts[0], 20);
        let balance = await token.balanceOf(accounts[0]);
        assert.equal(balance, (3079386683 * 10 ** 5) + 80);
    });

    it('verifies that a holder can destroy tokens from his/her own account', async () => {
        let token = await FinTabToken.new('5860000');
        await token.issue(accounts[1], 100);
        await token.destroy(accounts[1], 20);
        let balance = await token.balanceOf(accounts[1]);
        assert.equal(balance, 80);
    });

    it('should throw when a non owner attempts to destroy tokens', async () => {
        let token = await FinTabToken.new('5860000');
        await token.issue(accounts[1], 100);

        try {
            await token.destroy(accounts[1], 20, { from: accounts[2] });
            assert(false, "didn't throw");
        }
        catch (error) {
          return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('verifies the balances after a transfer', async () => {
        let token = await FinTabToken.new('5860000');
        await token.issue(accounts[1], 10000, { from: accounts[0] });
        await token.transfer(accounts[2], 500, { from: accounts[1] });
        let balance;
        balance = await token.balanceOf(accounts[1]);
        assert.equal(balance, 9500);
        balance = await token.balanceOf(accounts[2]);
        assert.equal(balance, 500);
    });


    it('should throw when attempting to transfer while transfers are disabled', async () => {
        let token = await FinTabToken.new('5860000');
        await token.transfer(accounts[1], 100);
        await token.disableTransfers(true);
        let transfersEnabled = await token.transfersEnabled();
        assert.equal(transfersEnabled, false);
        try {
            await token.transfer(accounts[1], 100);
            assert(false, "didn't throw");
        }
        catch (error) {
          return assertJump(error);
        }
        assert.fail('should have thrown before');
    });

    it('verifies the allowance after an approval', async () => {
        let token = await FinTabToken.new('5860000');
        await token.issue(accounts[0], 10000);
        await token.approve(accounts[1], 500);
        let allowance = await token.allowance(accounts[0], accounts[1]);
        assert.equal(allowance, 500);
    });

    it('should throw when attempting to transfer from while transfers are disabled', async () => {
        let token = await FinTabToken.new('5860000');
        let balance = await token.balanceOf(accounts[0]);
        assert.equal(balance, 3079386683 * 10 ** 5);
        await token.approve(accounts[1], 500);
        let allowance = await token.allowance(accounts[0], accounts[1]);
        assert.equal(allowance, 500);
        await token.transferFrom(accounts[0], accounts[2], 50, { from: accounts[1] });
        await token.disableTransfers(true);
        let transfersEnabled = await token.transfersEnabled();
        assert.equal(transfersEnabled, false);

        try {
            await token.transferFrom(accounts[0], accounts[2], 50, { from: accounts[1] });
            assert(false, "didn't throw");
        }
        catch (error) {
          return assertJump(error);
        }
        assert.fail('should have thrown before');
    });


    it('should not allow to burn tokens by not burners and owner', async () => {
      let token = await FinTabToken.new('5860000');
      await token.transfer(accounts[1], 100);
      try {
          await token.burn(100, { from: accounts[1] });
          assert(false, "didn't throw");
      }
      catch (error) {
        return assertJump(error);
      }
    });


    it('should allow to burn tokens by burners and owner', async () => {
      let token = await FinTabToken.new('5860000');
      await token.transfer(accounts[1], 100);
      await token.setBurner(accounts[1], true);
      await token.burn(100, { from: accounts[1] });
      assert.equal(true, true);
    });

});

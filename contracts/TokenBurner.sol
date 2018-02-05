pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./FinTabToken.sol";
import "./abstract/PriceReceiver.sol";
import "./abstract/ContractReceiver.sol";

/**
 * Contract which is aimed to work with FNTB. Provides 2 plans and keeps track on payments using events
 * plan1: 19$
 * plan2: 95$
 * The tokens per USD rate is provided by the PriceProvider. Ccurrently we use
 * ManualPriceProvider which allows to set the prices manually but
 * later, when FinTab hits exhange we will be able to change provider
 * to the ExchangePriceProvider which  uses Oracles to get the data from exchanges
 **/
contract TokenBurner is Ownable, PriceReceiver, ContractReceiver {
  using SafeMath for uint;

  uint public usdPrice; //Price tokens per 1 USD
  FinTabToken public token;
  address public team; //team wallet we should send 10% of tokens to
  uint public plan1 = 1900; //plan 1 price in cents +- 10
  uint public plan2 = 9500; //plan 2 price in cents +- 20
  uint public burnPercent = 90; //how many percent to be burned

  event ReceivedTokens(address _from, uint _value, address _token, uint change, uint team, bytes _data);


  function TokenBurner(address _token, address _team) public {
    token = FinTabToken(_token);
    team = _team;
  }



  /* function () payable {
     // TODO: check fallback function
  } */

  // Describes what happens when this address receives ERC223 token.
  // In this case we would like to find the correct plan for user
  // By the amount of tokens sent, send the change to the user,
  // burn 90% of tokens and send 10% to the team address
  // TODO: +- plan price
  function tokenFallback(address _from, uint _value, bytes _data) external {
      require(_value >= getPlan1TokenPrice());
      uint change = _value - getPlanTokenPrice(_value);
      uint teamAmount = getPlanTokenPrice(_value).div(100).mul(100 - burnPercent);
      uint burn = getPlanTokenPrice(_value).div(100).mul(burnPercent);
      if (change > 0) { //send the change in this case
        token.transfer(_from, change);
      }
      token.burn(burn);
      token.transfer(team, teamAmount);
      ReceivedTokens(_from, _value, msg.sender, change, teamAmount, _data); //all was done, emit event
  }

  // Set the price provider address to allow price updates
  function setPriceProvider(address _provider) external onlyOwner {
    priceProvider = _provider;
  }

  // Set percent of tookens to be burned
  function setBurnPercent(uint8 _percent) public onlyOwner {
    burnPercent = _percent;
  }

  // Receive the price and save to contract state
  function receivePrice(uint _usdPrice) external onlyPriceProvider {
    usdPrice = _usdPrice;
  }

  // Set the price of plan1 in cents
  function setPlan1(uint _plan) public onlyOwner {
    require(_plan > 0);
    plan1 = _plan;
  }

  // Set the price of plan in cents
  function setPlan2(uint _plan) public onlyOwner {
    require(_plan > 0);
    plan2 = _plan;
  }

  // TODO: +- plan price
  function getPlan2TokenPrice() internal view returns (uint) {
    return  plan2 * usdPrice * (10 ** 5);
  }

  // TODO: +- plan price
  function getPlan1TokenPrice() internal view returns (uint) {
    return  plan1 * usdPrice * (10 ** 5);
  }

  // @TODO: +- plan price
  function getPlanTokenPrice(uint _value) internal view returns (uint) {
    if (_value >= getPlan2TokenPrice()) {
      return  getPlan2TokenPrice();
    }
    return getPlan1TokenPrice();
  }

  function setTeamAddress(address _team) public onlyOwner {
    team = _team;
  }

}

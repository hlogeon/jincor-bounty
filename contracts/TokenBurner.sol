pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./token/FinTabToken.sol";
import "./abstract/PriceReceiver.sol";

contract TokenBurner is Ownable, PriceReceiver {
  using SafeMath for uint;
  uint256 public usdPrice;
  event ReceivedTokens(address _from, uint _value, address _token, uint change, uint team, bytes _data);

  FinTabToken public token;
  address public team;
  uint256 public plan1 = 1900;
  uint256 public plan2 = 9500;

  function TokenBurner(address _token, address _team) public {
    token = FinTabToken(_token);
    team = _team;
  }


  function tokenFallback(address _from, uint _value, bytes _data) external {
      require(_value >= getPlan1TokenPrice());
      uint256 change = _value - getPlanTokenPrice(_value);
      uint256 teamAmount = getPlanTokenPrice(_value).div(100).mul(10);
      uint256 burn = getPlanTokenPrice(_value).div(100).mul(90);
      if (change > 0) {
        token.transfer(_from, change);
      }
      token.burn(burn);
      token.transfer(team, teamAmount);
      ReceivedTokens(_from, _value, msg.sender, change, teamAmount, _data);
  }

  function setPriceProvider(address _provider) external onlyOwner {
    priceProvider = _provider;
  }

  function receivePrice(uint _usdPrice) external onlyPriceProvider {
    usdPrice = _usdPrice;
  }

  function setPlan1(uint256 _plan) public onlyOwner {
    require(_plan > 0);
    plan1 = _plan;
  }

  function setPlan2(uint256 _plan) public onlyOwner {
    require(_plan > 0);
    plan2 = _plan;
  }

  function getPlan2TokenPrice() internal returns (uint256) {
    return  plan2 * usdPrice * (10 ** 5);
  }

  function getPlan1TokenPrice() internal returns (uint256) {
    return  plan1 * usdPrice * (10 ** 5);
  }

  function getPlanTokenPrice(uint _value) internal returns (uint256) {
    if (_value >= getPlan2TokenPrice()) {
      return  getPlan2TokenPrice();
    }
    return getPlan1TokenPrice();
  }

}

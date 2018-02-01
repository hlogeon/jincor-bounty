pragma solidity ^0.4.15;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./PriceReceiver.sol";

contract PriceProvider is Ownable {
  using SafeMath for uint;

  enum State { Stopped, Active }

  uint public currentPrice;

  PriceReceiver public watcher;

  State public state = State.Stopped;

  event InsufficientFunds();

  function notifyWatcher() internal;

  modifier inActiveState() {
    require(state == State.Active);
    _;
  }

  modifier inStoppedState() {
    require(state == State.Stopped);
    _;
  }

  function setWatcher(address newWatcher) external onlyOwner {
    require(newWatcher != 0x0);
    watcher = PriceReceiver(newWatcher);
  }


  //we need to get back our funds if we don't need this oracle anymore
  function withdraw(address receiver) external onlyOwner inStoppedState {
    require(receiver != 0x0);
    receiver.transfer(this.balance);
  }

}

pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./TokenBurner.sol";
import "./abstract/PriceProvider.sol";
import "./abstract/PriceReceiver.sol";


contract ManualPriceProvider is PriceProvider {

  function ManualPriceProvider(address _receiver) {
    state = State.Active;
    watcher = PriceReceiver(_receiver);
  }

  function setPrice(uint256 _price) public onlyOwner {
      require(_price > 0);
      currentPrice = _price;
      if (state == State.Active) {
        notifyWatcher();
      }
  }

  function notifyWatcher() internal {
    watcher.receivePrice(currentPrice);
  }

}

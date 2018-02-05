pragma solidity ^0.4.15;

import "./TokenBurner.sol";
import "./abstract/PriceProvider.sol";
import "./abstract/PriceReceiver.sol";

/**
 * PriceProvider which allows an owner to set the price manually
 *
**/
contract ManualPriceProvider is PriceProvider {

  function ManualPriceProvider(address _receiver) public {
    state = State.Active;
    watcher = PriceReceiver(_receiver);
  }

  // Set the current price value
  function setPrice(uint _price) public onlyOwner {
      require(_price > 0);
      currentPrice = _price;
      if (state == State.Active) {
        notifyWatcher();
      }
  }

  // Notify watcher conrtract that price were changed
  function notifyWatcher() internal {
    watcher.receivePrice(currentPrice);
  }

}

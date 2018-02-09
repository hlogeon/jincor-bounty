pragma solidity ^0.4.18;


contract PriceReceiver {

    address public priceProvider;

    modifier onlyPriceProvider() {
        require(msg.sender == priceProvider);
        _;
    }

    function receivePrice(uint _usdPrice) external;

    function setPriceProvider(address _provider) external;
}

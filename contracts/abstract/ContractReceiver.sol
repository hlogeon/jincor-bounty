pragma solidity ^0.4.13;

contract ContractReceiver {
   function tokenFallback(address _from, uint _value, bytes _data) external;
}

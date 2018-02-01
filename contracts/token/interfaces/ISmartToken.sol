pragma solidity ^0.4.15;
import './IOwned.sol';
import './IERC20Token.sol';

/*
    Smart Token interface
*/
contract ISmartToken is IOwned, IERC20Token {
    function disableTransfers(bool _disable) public;
    function issue(address _to, uint _amount) public;
    function destroy(address _from, uint _amount) public;
}

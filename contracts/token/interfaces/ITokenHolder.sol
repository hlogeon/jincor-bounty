pragma solidity ^0.4.13;
import './IOwned.sol';
import './IERC20Token.sol';

/*
    Token Holder interface
*/
contract ITokenHolder is IOwned {
    function withdrawTokens(IERC20Token _token, address _to, uint _amount) public;
}

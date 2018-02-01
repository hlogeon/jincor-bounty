pragma solidity ^0.4.15;
import './ITokenHolder.sol';
import './IERC20Token.sol';

/*
    Ether Token interface
*/
contract IEtherToken is ITokenHolder, IERC20Token {
    function deposit() public payable;
    function withdraw(uint _amount) public;
    function withdrawTo(address _to, uint _amount) public;
}

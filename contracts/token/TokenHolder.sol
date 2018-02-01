pragma solidity ^0.4.15;

import '../Utils.sol';
import './interfaces/IERC20Token.sol';
import './interfaces/ITokenHolder.sol';
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/*
    We consider every contract to be a 'token holder' since it's currently not possible
    for a contract to deny receiving tokens.

    The TokenHolder's contract sole purpose is to provide a safety mechanism that allows
    the owner to send tokens that were sent to the contract by mistake back to their sender.
*/
contract TokenHolder is ITokenHolder, Ownable, Utils {

    // @dev constructor
    function TokenHolder() public {
    }


    //  @dev withdraws tokens held by the contract and sends them to an account
    //  can only be called by the owner
    // @param _token   ERC20 token contract address
    // @param _to      account to receive the new amount
    // @param _amount  amount to withdraw
    function withdrawTokens(IERC20Token _token, address _to, uint _amount) public
    onlyOwner
    validAddress(_to)
    {
        require(_to != address(this));
        assert(_token.transfer(_to, _amount));
    }
}

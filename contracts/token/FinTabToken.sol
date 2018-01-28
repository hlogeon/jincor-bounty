pragma solidity ^0.4.11;

import "./SmartToken.sol";
import "./ContractReceiver.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title FinTabToken
 *
 * @dev Burnable Ownable ERC20 token
 */
contract FinTabToken is SmartToken {

  event Transfer(address indexed _from, address indexed _to, uint256 _value, bytes _data);

  string public constant name = "FinTab";
  string public constant symbol = "FNTB";
  uint8 public constant decimals = 8;
  uint public constant INITIAL_SUPPLY = 5000000 * (10 ** 8);

  /* The finalizer contract that allows unlift the transfer limits on this token */
  address public releaseAgent;

  /** A crowdsale contract can release us to the wild if ICO success. If false we are are in transfer lock up period.*/
  bool public released = false;

  mapping (address => bool) public teamAddresses;


  /**
   * Limit token transfer for  the team
   *
   */
  modifier canTransfer(address _sender) {
    require(released || !teamAddresses[_sender]);
    _;
  }

  modifier onlyReleaseAgent() {
    require(releaseAgent == msg.sender);
    _;
  }

  /** The function can be called only before or after the tokens have been releasesd */
  modifier inReleaseState(bool releaseState) {
    require(releaseState == released);
    _;
  }

  /**
   * @dev Contructor that gives msg.sender all of existing tokens.
   */
  function FinTabToken() {
    totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    releaseAgent = msg.sender;
    NewSmartToken(address(this));
  }

  function setReleaseAgent(address _rAgent) onlyOwner inReleaseState(false) public {
    releaseAgent = _rAgent;
  }

  function release() onlyReleaseAgent inReleaseState(false) public {
    released = true;
  }


  /**
   * Owner can allow a particular address (a crowdsale contract) to transfer tokens despite the lock up period.
   */
  function setTeamAddress(address addr, bool state) onlyOwner inReleaseState(false) public {
    require(addr != 0x0);
    teamAddresses[addr] = state;
  }

  // Function that is called when a user or another contract wants to transfer funds .
  function transfer(address _to, uint _value, bytes _data) transfersAllowed canTransfer(msg.sender) returns (bool success) {
    if(isContract(_to)) {
        return transferToContract(_to, _value, _data);
    }
    else {
        return transferToAddress(_to, _value, _data);
    }
  }

  // Standard function transfer similar to ERC20 transfer with no _data .
  // Added due to backwards compatibility reasons .
  function transfer(address _to, uint _value) transfersAllowed canTransfer(msg.sender) returns (bool success) {
    //standard function transfer similar to ERC20 transfer with no _data
    //added due to backwards compatibility reasons
    bytes memory empty;
    if(isContract(_to)) {
        return transferToContract(_to, _value, empty);
    }
    else {
        return transferToAddress(_to, _value, empty);
    }
  }

  function transferFrom(address _from, address _to, uint _value) transfersAllowed canTransfer(_from) returns (bool success) {
    // Call Burnable.transferForm()
    return super.transferFrom(_from, _to, _value);
  }

  function burn(uint _value) onlyOwner canTransfer(msg.sender) returns (bool success) {
    return super.burn(_value);
  }

  function burnFrom(address _from, uint _value) onlyOwner  canTransfer(_from) returns (bool success) {
    return super.burnFrom(_from, _value);
  }


  //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
  function isContract(address _addr) private returns (bool is_contract) {
      uint length;
      assembly {
            //retrieve the size of the code on target address, this needs assembly
            length := extcodesize(_addr)
      }
      return (length>0);
    }

    //function that is called when transaction target is an address
  function transferToAddress(address _to, uint _value, bytes _data) private canTransfer(msg.sender) returns (bool success) {
    require(balanceOf(msg.sender) >= _value);
    balances[msg.sender] = safeSub(balanceOf(msg.sender), _value);
    balances[_to] = safeAdd(balanceOf(_to), _value);
    Transfer(msg.sender, _to, _value, _data);
    return true;
  }

  //function that is called when transaction target is a contract
  function transferToContract(address _to, uint _value, bytes _data) private canTransfer(msg.sender) returns (bool success) {
    require(balanceOf(msg.sender) >= _value);
    balances[msg.sender] = safeSub(balanceOf(msg.sender), _value);
    balances[_to] = safeAdd(balanceOf(_to), _value);
    ContractReceiver receiver = ContractReceiver(_to);
    receiver.tokenFallback(msg.sender, _value, _data);
    Transfer(msg.sender, _to, _value, _data);
    return true;
  }
}

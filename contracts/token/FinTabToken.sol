pragma solidity ^0.4.15;

import "./SmartToken.sol";
import "../abstract/ContractReceiver.sol";

/**
 * @title FinTabToken
 *
 * @dev Burnable Ownable ERC223(and ERC20-compilant) token with support of
 * Bancor SmartToken protocol
 */
contract FinTabToken is SmartToken {

  uint public constant INITIAL_SUPPLY = 5000000 * (10 ** 8);

  // The finalizer contract that allows unlift the transfer limits on this token
  address public releaseAgent;

  // A crowdsale contract can release us to the wild if ICO success. If false we are are in transfer lock up period.
  bool public released = false;

  mapping (address => bool) public teamAddresses;

  event Transfer(address indexed _from, address indexed _to, uint _value, bytes _data);

  function name() public constant returns (string) { return "FinTab"; }
  function symbol() public constant returns (string) { return "FNTB" ;}
  function decimals() public constant returns (uint8) { return 8; }

  function totalSupply() public constant returns (uint) {
    return totalSupply_;
  }
  function balanceOf(address _owner) public constant returns (uint balance) {
    require(_owner != 0x0);
    return balances[_owner];
  }

  // Limit token transfer for  the team
  modifier canTransfer(address _sender) {
    require(released || !teamAddresses[_sender]);
    _;
  }

  // The function can be called only by release agent
  modifier onlyReleaseAgent() {
    require(releaseAgent == msg.sender);
    _;
  }

  // The function can be called only before or after the tokens have been releasesd
  modifier inReleaseState(bool releaseState) {
    require(releaseState == released);
    _;
  }

  // Token construcor
  function FinTabToken() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    releaseAgent = msg.sender;
    NewSmartToken(address(this));
  }

  // Owner can set releaseAgent address
  function setReleaseAgent(address _rAgent) onlyOwner inReleaseState(false) public {
    releaseAgent = _rAgent;
  }

  // Release agent can release token
  function release() onlyReleaseAgent inReleaseState(false) public {
    released = true;
  }


  // Owner can allow a particular address (a crowdsale contract) to transfer tokens despite the lock up period.
  function setTeamAddress(address addr, bool state) onlyOwner inReleaseState(false) public {
    require(addr != 0x0);
    teamAddresses[addr] = state;
  }

  // Function that is called when a user or another contract wants to transfer funds .
  function transfer(address _to, uint _value, bytes _data) transfersAllowed canTransfer(msg.sender) public returns (bool success) {
    if(isContract(_to)) {
        return transferToContract(_to, _value, _data);
    }
    else {
        return transferToAddress(_to, _value, _data);
    }
  }

  // Standard function transfer similar to ERC20 transfer with no _data .
  // Added due to backwards compatibility reasons .
  function transfer(address _to, uint _value) transfersAllowed canTransfer(msg.sender) public returns (bool success) {
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

  // Transfer on _from behalf
  function transferFrom(address _from, address _to, uint _value) transfersAllowed canTransfer(_from) public returns (bool success) {
    // Call Burnable.transferForm()
    return super.transferFrom(_from, _to, _value);
  }

  // Burn tokens
  function burn(uint _value) canTransfer(msg.sender) public returns (bool success) {
    return super.burn(_value);
  }

  // Burn tokens on _from behalf
  function burnFrom(address _from, uint _value) onlyOwner  canTransfer(_from) public returns (bool success) {
    return super.burnFrom(_from, _value);
  }


  //assemble the given address bytecode. If bytecode exists then the _addr is a contract.
  function isContract(address _addr) private view returns (bool is_contract) {
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

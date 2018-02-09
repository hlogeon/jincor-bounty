pragma solidity ^0.4.15;
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Migrations is Ownable {

    uint public lastCompletedMigration;

    function Migrations() public {

    }

    function setCompleted(uint completed) public onlyOwner {
        lastCompletedMigration = completed;
    }

    function upgrade(address newAddress) public onlyOwner {
        Migrations upgraded = Migrations(newAddress);
        upgraded.setCompleted(lastCompletedMigration);
    }
}

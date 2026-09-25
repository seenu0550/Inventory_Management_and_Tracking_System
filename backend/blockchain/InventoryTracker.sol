// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InventoryTracker {

    struct Product {
        string productId;
        string name;
        address owner;
        string currentLocation;
        bool exists;
    }

    struct Transfer {
        string productId;
        address from;
        address to;
        string fromLocation;
        string toLocation;
        uint256 quantity;
        uint256 timestamp;
    }

    mapping(string => Product) public products;
    mapping(string => Transfer[]) public transferHistory;
    mapping(string => bytes32) public dataHashes;

    event ProductRegistered(string productId, string name, address owner, uint256 timestamp);
    event InventoryTransferred(string productId, address from, address to, string fromLocation, string toLocation, uint256 quantity, uint256 timestamp);
    event OwnershipTransferred(string productId, address previousOwner, address newOwner, uint256 timestamp);
    event InventoryReceived(string productId, address receiver, string location, uint256 quantity, uint256 timestamp);
    event DataHashStored(string referenceId, bytes32 dataHash, uint256 timestamp);

    modifier productExists(string memory productId) {
        require(products[productId].exists, "Product does not exist");
        _;
    }

    function registerProduct(string memory productId, string memory name, string memory location) public {
        require(!products[productId].exists, "Product already registered");
        products[productId] = Product(productId, name, msg.sender, location, true);
        emit ProductRegistered(productId, name, msg.sender, block.timestamp);
    }

    function transferInventory(
        string memory productId,
        address to,
        string memory fromLocation,
        string memory toLocation,
        uint256 quantity
    ) public productExists(productId) {
        Transfer memory t = Transfer(productId, msg.sender, to, fromLocation, toLocation, quantity, block.timestamp);
        transferHistory[productId].push(t);
        products[productId].currentLocation = toLocation;
        emit InventoryTransferred(productId, msg.sender, to, fromLocation, toLocation, quantity, block.timestamp);
    }

    function transferOwnership(string memory productId, address newOwner) public productExists(productId) {
        address previous = products[productId].owner;
        products[productId].owner = newOwner;
        emit OwnershipTransferred(productId, previous, newOwner, block.timestamp);
    }

    function confirmReceived(string memory productId, string memory location, uint256 quantity) public productExists(productId) {
        products[productId].currentLocation = location;
        emit InventoryReceived(productId, msg.sender, location, quantity, block.timestamp);
    }

    function storeDataHash(string memory referenceId, bytes32 dataHash) public {
        dataHashes[referenceId] = dataHash;
        emit DataHashStored(referenceId, dataHash, block.timestamp);
    }

    function verifyDataHash(string memory referenceId, bytes32 dataHash) public view returns (bool) {
        return dataHashes[referenceId] == dataHash;
    }

    function getTransferHistory(string memory productId) public view returns (Transfer[] memory) {
        return transferHistory[productId];
    }

    function getProduct(string memory productId) public view returns (Product memory) {
        return products[productId];
    }
}

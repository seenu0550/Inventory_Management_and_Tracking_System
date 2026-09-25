const { Web3 } = require('web3');
const crypto = require('crypto');

const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545');

// ABI for the InventoryTracker contract — update after deployment
const CONTRACT_ABI = [
  { "inputs": [{ "internalType": "string", "name": "productId", "type": "string" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "location", "type": "string" }], "name": "registerProduct", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "productId", "type": "string" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "string", "name": "fromLocation", "type": "string" }, { "internalType": "string", "name": "toLocation", "type": "string" }, { "internalType": "uint256", "name": "quantity", "type": "uint256" }], "name": "transferInventory", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "productId", "type": "string" }, { "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "productId", "type": "string" }, { "internalType": "string", "name": "location", "type": "string" }, { "internalType": "uint256", "name": "quantity", "type": "uint256" }], "name": "confirmReceived", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "referenceId", "type": "string" }, { "internalType": "bytes32", "name": "dataHash", "type": "bytes32" }], "name": "storeDataHash", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "referenceId", "type": "string" }, { "internalType": "bytes32", "name": "dataHash", "type": "bytes32" }], "name": "verifyDataHash", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "productId", "type": "string" }], "name": "getTransferHistory", "outputs": [{ "components": [{ "internalType": "string", "name": "productId", "type": "string" }, { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "string", "name": "fromLocation", "type": "string" }, { "internalType": "string", "name": "toLocation", "type": "string" }, { "internalType": "uint256", "name": "quantity", "type": "uint256" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "internalType": "struct InventoryTracker.Transfer[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "productId", "type": "string" }], "name": "getProduct", "outputs": [{ "components": [{ "internalType": "string", "name": "productId", "type": "string" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "string", "name": "currentLocation", "type": "string" }, { "internalType": "bool", "name": "exists", "type": "bool" }], "internalType": "struct InventoryTracker.Product", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }
];

const getContract = () => {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error('CONTRACT_ADDRESS not set in .env');
  return new web3.eth.Contract(CONTRACT_ABI, address);
};

const getAccounts = () => web3.eth.getAccounts();

const generateDataHash = (data) =>
  '0x' + crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

module.exports = { web3, getContract, getAccounts, generateDataHash };

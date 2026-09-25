const BlockchainTransaction = require('../models/BlockchainTransaction');
const Product = require('../models/Product');
const { getContract, getAccounts, generateDataHash } = require('../blockchain/web3Config');

const registerProductOnChain = async (req, res) => {
  const { productId, location } = req.body;
  const product = await Product.findOne({ productId });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  try {
    const contract = getContract();
    const accounts = await getAccounts();
    const from = accounts[0];

    const tx = await contract.methods.registerProduct(product.productId, product.name, location || 'origin').send({ from, gas: 300000 });
    const dataHash = generateDataHash({ productId: product.productId, name: product.name });

    const record = await BlockchainTransaction.create({
      txHash: tx.transactionHash,
      blockNumber: Number(tx.blockNumber),
      eventType: 'product_registered',
      referenceId: product.productId,
      referenceModel: 'Product',
      dataHash,
      fromAddress: from,
      initiatedBy: req.user._id,
      metadata: { productId: product.productId, name: product.name }
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Blockchain error', error: err.message });
  }
};

const recordInventoryTransfer = async (req, res) => {
  const { productId, toAddress, fromLocation, toLocation, quantity } = req.body;

  try {
    const contract = getContract();
    const accounts = await getAccounts();
    const from = accounts[0];

    const tx = await contract.methods.transferInventory(productId, toAddress, fromLocation, toLocation, quantity).send({ from, gas: 300000 });
    const dataHash = generateDataHash({ productId, fromLocation, toLocation, quantity });

    const record = await BlockchainTransaction.create({
      txHash: tx.transactionHash,
      blockNumber: Number(tx.blockNumber),
      eventType: 'inventory_transfer',
      referenceId: productId,
      referenceModel: 'Inventory',
      dataHash,
      fromAddress: from,
      toAddress,
      initiatedBy: req.user._id,
      metadata: { productId, fromLocation, toLocation, quantity }
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: 'Blockchain error', error: err.message });
  }
};

const verifyTransaction = async (req, res) => {
  const { referenceId, data } = req.body;

  try {
    const contract = getContract();
    const computedHash = generateDataHash(data);
    const isValid = await contract.methods.verifyDataHash(referenceId, computedHash).call();

    const dbRecord = await BlockchainTransaction.findOne({ referenceId }).sort({ createdAt: -1 });

    res.json({
      referenceId,
      isValid,
      computedHash,
      storedHash: dbRecord?.dataHash,
      txHash: dbRecord?.txHash,
      blockNumber: dbRecord?.blockNumber
    });
  } catch (err) {
    res.status(500).json({ message: 'Verification error', error: err.message });
  }
};

const getAllTransactions = async (req, res) => {
  const { eventType, referenceModel } = req.query;
  const filter = {};
  if (eventType) filter.eventType = eventType;
  if (referenceModel) filter.referenceModel = referenceModel;

  const transactions = await BlockchainTransaction.find(filter)
    .populate('initiatedBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(transactions);
};

const getTransactionByHash = async (req, res) => {
  const tx = await BlockchainTransaction.findOne({ txHash: req.params.hash }).populate('initiatedBy', 'name email');
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json(tx);
};

const getProductChainHistory = async (req, res) => {
  const { productId } = req.params;
  try {
    const contract = getContract();
    const history = await contract.methods.getTransferHistory(productId).call();
    const dbRecords = await BlockchainTransaction.find({ referenceId: productId }).sort({ createdAt: 1 });
    res.json({ onChain: history, offChain: dbRecords });
  } catch (err) {
    res.status(500).json({ message: 'Blockchain error', error: err.message });
  }
};

module.exports = { registerProductOnChain, recordInventoryTransfer, verifyTransaction, getAllTransactions, getTransactionByHash, getProductChainHistory };

const Transfer = require('../models/Transfer');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const { getContract, getAccounts, generateDataHash } = require('../blockchain/web3Config');

const recordTransferOnChain = async (transfer, user) => {
  try {
    const contract = getContract();
    const accounts = await getAccounts();
    const from = accounts[0];
    const dataHash = generateDataHash({ transferId: transfer.transferId, product: transfer.product, quantity: transfer.quantity });
    const tx = await contract.methods.storeDataHash(transfer.transferId, dataHash).send({ from, gas: 300000 });
    await BlockchainTransaction.create({
      txHash: tx.transactionHash,
      blockNumber: Number(tx.blockNumber),
      eventType: 'inventory_transfer',
      referenceId: transfer.transferId,
      referenceModel: 'Inventory',
      dataHash,
      initiatedBy: user._id,
      metadata: { transferId: transfer.transferId, fromWarehouse: transfer.fromWarehouse, toWarehouse: transfer.toWarehouse, quantity: transfer.quantity }
    });
    return tx.transactionHash;
  } catch { return null; }
};

const initiateTransfer = async (req, res) => {
  const { productId, fromWarehouse, toWarehouse, quantity, note } = req.body;

  const sourceInventory = await Inventory.findOne({ product: productId, warehouse: fromWarehouse });
  if (!sourceInventory) return res.status(404).json({ message: 'Source inventory not found' });
  if (sourceInventory.quantity < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  const transfer = await Transfer.create({ product: productId, fromWarehouse, toWarehouse, quantity, note, initiatedBy: req.user._id });

  await Notification.create({
    type: 'transfer_initiated',
    title: 'Stock Transfer Initiated',
    message: `Transfer of ${quantity} units from ${fromWarehouse} to ${toWarehouse} has been initiated.`,
    recipient: req.user._id,
    referenceId: transfer.transferId,
    referenceModel: 'Transfer'
  });

  res.status(201).json(transfer);
};

const confirmBySender = async (req, res) => {
  const transfer = await Transfer.findById(req.params.id);
  if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
  if (transfer.status !== 'pending') return res.status(400).json({ message: 'Transfer already processed' });

  const sourceInventory = await Inventory.findOne({ product: transfer.product, warehouse: transfer.fromWarehouse });
  if (!sourceInventory || sourceInventory.quantity < transfer.quantity)
    return res.status(400).json({ message: 'Insufficient stock' });

  sourceInventory.quantity -= transfer.quantity;
  sourceInventory.lastUpdatedBy = req.user._id;
  await sourceInventory.save();

  transfer.status = 'confirmed_by_sender';
  transfer.confirmedBySender = req.user._id;
  await transfer.save();

  res.json(transfer);
};

const confirmByReceiver = async (req, res) => {
  const transfer = await Transfer.findById(req.params.id);
  if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
  if (transfer.status !== 'confirmed_by_sender') return res.status(400).json({ message: 'Sender must confirm first' });

  let destInventory = await Inventory.findOne({ product: transfer.product, warehouse: transfer.toWarehouse });
  if (destInventory) {
    destInventory.quantity += transfer.quantity;
    destInventory.lastUpdatedBy = req.user._id;
    await destInventory.save();
  } else {
    destInventory = await Inventory.create({ product: transfer.product, warehouse: transfer.toWarehouse, quantity: transfer.quantity, lastUpdatedBy: req.user._id });
  }

  transfer.status = 'completed';
  transfer.confirmedByReceiver = req.user._id;
  const txHash = await recordTransferOnChain(transfer, req.user);
  if (txHash) transfer.blockchainTxHash = txHash;
  await transfer.save();

  await Notification.create({
    type: 'transfer_confirmed',
    title: 'Stock Transfer Completed',
    message: `Transfer of ${transfer.quantity} units to ${transfer.toWarehouse} has been confirmed and completed.`,
    recipient: transfer.initiatedBy,
    referenceId: transfer.transferId,
    referenceModel: 'Transfer'
  });

  res.json(transfer);
};

const getAllTransfers = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const transfers = await Transfer.find(filter)
    .populate('product', 'name productId')
    .populate('initiatedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(transfers);
};

const cancelTransfer = async (req, res) => {
  const transfer = await Transfer.findById(req.params.id);
  if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
  if (transfer.status === 'completed') return res.status(400).json({ message: 'Cannot cancel a completed transfer' });

  if (transfer.status === 'confirmed_by_sender') {
    const sourceInventory = await Inventory.findOne({ product: transfer.product, warehouse: transfer.fromWarehouse });
    if (sourceInventory) { sourceInventory.quantity += transfer.quantity; await sourceInventory.save(); }
  }

  transfer.status = 'cancelled';
  await transfer.save();
  res.json({ message: 'Transfer cancelled', transfer });
};

module.exports = { initiateTransfer, confirmBySender, confirmByReceiver, getAllTransfers, cancelTransfer };

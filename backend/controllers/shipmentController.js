const { validationResult } = require('express-validator');
const Shipment = require('../models/Shipment');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const { getContract, getAccounts, generateDataHash } = require('../blockchain/web3Config');

const recordToBlockchain = async (shipment, eventType, user) => {
  try {
    const contract = getContract();
    const accounts = await getAccounts();
    const from = accounts[0];

    const dataHash = generateDataHash({ shipmentId: shipment.shipmentId, product: shipment.product, quantity: shipment.quantity });

    const tx = await contract.methods.storeDataHash(shipment.shipmentId, dataHash).send({ from, gas: 300000 });

    await BlockchainTransaction.create({
      txHash: tx.transactionHash,
      blockNumber: Number(tx.blockNumber),
      eventType,
      referenceId: shipment.shipmentId,
      referenceModel: 'Shipment',
      dataHash,
      initiatedBy: user._id,
      metadata: { shipmentId: shipment.shipmentId, status: shipment.status }
    });

    return tx.transactionHash;
  } catch {
    return null;
  }
};

const createShipment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const shipment = await Shipment.create({ ...req.body, createdBy: req.user._id, statusHistory: [{ status: 'pending', updatedBy: req.user._id }] });

  const txHash = await recordToBlockchain(shipment, 'shipment_created', req.user);
  if (txHash) { shipment.blockchainTxHash = txHash; await shipment.save(); }

  res.status(201).json(shipment);
};

const getAllShipments = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const shipments = await Shipment.find(filter)
    .populate('product', 'name productId')
    .populate('supplier', 'name email')
    .populate('createdBy', 'name');
  res.json(shipments);
};

const getShipmentById = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id)
    .populate('product', 'name productId category')
    .populate('supplier', 'name email')
    .populate('statusHistory.updatedBy', 'name');
  if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
  res.json(shipment);
};

const updateShipmentStatus = async (req, res) => {
  const { status, note } = req.body;
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

  shipment.status = status;
  shipment.statusHistory.push({ status, note, updatedBy: req.user._id });
  if (status === 'dispatched') shipment.dispatchedAt = new Date();
  if (status === 'received') shipment.receivedAt = new Date();

  await shipment.save();
  res.json(shipment);
};

const dispatchShipment = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
  if (shipment.status !== 'pending') return res.status(400).json({ message: 'Only pending shipments can be dispatched' });

  shipment.status = 'dispatched';
  shipment.dispatchedAt = new Date();
  shipment.statusHistory.push({ status: 'dispatched', updatedBy: req.user._id });
  await shipment.save();
  res.json(shipment);
};

const confirmReceived = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
  if (shipment.status !== 'dispatched' && shipment.status !== 'in_transit')
    return res.status(400).json({ message: 'Shipment must be dispatched or in transit to confirm receipt' });

  shipment.status = 'received';
  shipment.receivedAt = new Date();
  shipment.statusHistory.push({ status: 'received', note: req.body.note, updatedBy: req.user._id });

  const txHash = await recordToBlockchain(shipment, 'shipment_received', req.user);
  if (txHash) shipment.blockchainTxHash = txHash;

  await shipment.save();
  res.json(shipment);
};

const getShipmentHistory = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id).select('shipmentId statusHistory').populate('statusHistory.updatedBy', 'name');
  if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
  res.json(shipment.statusHistory);
};

module.exports = { createShipment, getAllShipments, getShipmentById, updateShipmentStatus, dispatchShipment, confirmReceived, getShipmentHistory };

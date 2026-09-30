const crypto = require('crypto');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Shipment = require('../models/Shipment');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const { getContract, generateDataHash } = require('../blockchain/web3Config');

const generateHash = (data) => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

const verifyProduct = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({ productId }).lean();
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const currentHash = generateHash({ productId: product.productId, name: product.name, category: product.category, price: product.price });

  const dbRecord = await BlockchainTransaction.findOne({ referenceId: productId, eventType: 'product_registered' }).sort({ createdAt: -1 });

  let blockchainVerified = false;
  let onChainHash = null;

  try {
    const contract = getContract();
    const hexHash = '0x' + currentHash;
    blockchainVerified = await contract.methods.verifyDataHash(productId, hexHash).call();
    onChainHash = dbRecord?.dataHash || null;
  } catch { /* blockchain not available */ }

  const isTampered = dbRecord ? dbRecord.dataHash !== '0x' + currentHash : false;

  res.json({
    productId,
    currentHash,
    storedHash: dbRecord?.dataHash || null,
    blockchainVerified,
    isTampered,
    verificationStatus: isTampered ? 'TAMPERED' : dbRecord ? 'VERIFIED' : 'NOT_RECORDED',
    lastBlockchainRecord: dbRecord ? { txHash: dbRecord.txHash, blockNumber: dbRecord.blockNumber, createdAt: dbRecord.createdAt } : null
  });
};

const verifyInventory = async (req, res) => {
  const inventory = await Inventory.findById(req.params.id).populate('product', 'productId name').lean();
  if (!inventory) return res.status(404).json({ message: 'Inventory record not found' });

  const currentHash = generateHash({ product: inventory.product._id, warehouse: inventory.warehouse, quantity: inventory.quantity });

  const dbRecord = await BlockchainTransaction.findOne({ referenceId: inventory.product.productId, eventType: 'inventory_transfer' }).sort({ createdAt: -1 });

  const isTampered = dbRecord ? dbRecord.dataHash !== '0x' + currentHash : false;

  res.json({
    inventoryId: inventory._id,
    product: inventory.product,
    warehouse: inventory.warehouse,
    quantity: inventory.quantity,
    currentHash,
    storedHash: dbRecord?.dataHash || null,
    isTampered,
    verificationStatus: isTampered ? 'TAMPERED' : dbRecord ? 'VERIFIED' : 'NOT_RECORDED'
  });
};

const verifyShipment = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id).lean();
  if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

  const currentHash = generateHash({ shipmentId: shipment.shipmentId, product: shipment.product, quantity: shipment.quantity, source: shipment.source, destination: shipment.destination });

  const dbRecord = await BlockchainTransaction.findOne({ referenceId: shipment.shipmentId }).sort({ createdAt: -1 });

  const isTampered = dbRecord ? dbRecord.dataHash !== '0x' + currentHash : false;

  res.json({
    shipmentId: shipment.shipmentId,
    currentHash,
    storedHash: dbRecord?.dataHash || null,
    isTampered,
    verificationStatus: isTampered ? 'TAMPERED' : dbRecord ? 'VERIFIED' : 'NOT_RECORDED',
    lastBlockchainRecord: dbRecord ? { txHash: dbRecord.txHash, blockNumber: dbRecord.blockNumber } : null
  });
};

module.exports = { verifyProduct, verifyInventory, verifyShipment };

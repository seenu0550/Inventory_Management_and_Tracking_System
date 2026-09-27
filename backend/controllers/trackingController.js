const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Shipment = require('../models/Shipment');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const { getContract } = require('../blockchain/web3Config');

const getProductJourney = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({ productId })
    .populate('supplier', 'name email company')
    .populate('createdBy', 'name role');
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const shipments = await Shipment.find({ product: product._id })
    .populate('createdBy', 'name role')
    .populate('statusHistory.updatedBy', 'name role')
    .sort({ createdAt: 1 });

  const inventory = await Inventory.find({ product: product._id });

  const blockchainRecords = await BlockchainTransaction.find({ referenceId: productId })
    .populate('initiatedBy', 'name role')
    .sort({ createdAt: 1 });

  // Build journey timeline
  const journey = [];

  journey.push({
    step: 'Product Registered',
    timestamp: product.createdAt,
    actor: product.createdBy,
    location: 'Origin',
    status: 'completed'
  });

  shipments.forEach(s => {
    journey.push({
      step: `Shipment ${s.shipmentId}`,
      from: s.source,
      to: s.destination,
      status: s.status,
      dispatchedAt: s.dispatchedAt,
      receivedAt: s.receivedAt,
      timestamp: s.createdAt,
      actor: s.createdBy,
      blockchainTxHash: s.blockchainTxHash || null
    });
  });

  const currentLocations = inventory.map(i => ({ warehouse: i.warehouse, quantity: i.quantity }));
  const lastShipment = shipments[shipments.length - 1];

  res.json({
    product: { productId: product.productId, name: product.name, category: product.category, status: product.status },
    currentLocations,
    currentStatus: lastShipment?.status || 'in_stock',
    currentOwner: lastShipment?.createdBy || product.createdBy,
    journey,
    blockchainRecords,
    totalShipments: shipments.length
  });
};

const getCurrentLocation = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({ productId });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const inventory = await Inventory.find({ product: product._id, quantity: { $gt: 0 } });
  const lastShipment = await Shipment.findOne({ product: product._id }).sort({ createdAt: -1 });

  // Try to get on-chain location
  let onChainLocation = null;
  try {
    const contract = getContract();
    const onChainProduct = await contract.methods.getProduct(productId).call();
    if (onChainProduct.exists) onChainLocation = onChainProduct.currentLocation;
  } catch { /* blockchain not available */ }

  res.json({
    productId,
    name: product.name,
    currentLocations: inventory.map(i => ({ warehouse: i.warehouse, quantity: i.quantity })),
    lastShipmentDestination: lastShipment?.destination || null,
    onChainLocation,
    lastUpdated: lastShipment?.updatedAt || product.updatedAt
  });
};

const getPreviousLocations = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({ productId });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const shipments = await Shipment.find({ product: product._id })
    .select('shipmentId source destination status dispatchedAt receivedAt')
    .sort({ createdAt: 1 });

  const locations = shipments.map(s => ({
    shipmentId: s.shipmentId,
    from: s.source,
    to: s.destination,
    status: s.status,
    movedAt: s.dispatchedAt || s.createdAt
  }));

  res.json({ productId, locations });
};

module.exports = { getProductJourney, getCurrentLocation, getPreviousLocations };

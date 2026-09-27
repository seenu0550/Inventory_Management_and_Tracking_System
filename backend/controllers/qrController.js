const QRCode = require('qrcode');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Shipment = require('../models/Shipment');
const BlockchainTransaction = require('../models/BlockchainTransaction');

const generateQR = async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findOne({ productId }).populate('supplier', 'name email');
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const qrData = JSON.stringify({
    productId: product.productId,
    name: product.name,
    category: product.category,
    batchNumber: product.batchNumber || null,
    sku: product.sku || null,
    verifyUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/tracking/${product.productId}`
  });

  const qrCodeBase64 = await QRCode.toDataURL(qrData);

  res.json({
    productId: product.productId,
    name: product.name,
    qrCode: qrCodeBase64,
    qrData: JSON.parse(qrData)
  });
};

const scanQR = async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId is required' });

  const product = await Product.findOne({ productId })
    .populate('supplier', 'name email')
    .populate('createdBy', 'name');
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const inventory = await Inventory.find({ product: product._id });
  const shipments = await Shipment.find({ product: product._id })
    .select('shipmentId source destination status dispatchedAt receivedAt')
    .sort({ createdAt: -1 });

  const blockchainRecords = await BlockchainTransaction.find({ referenceId: productId })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    product,
    currentStock: inventory,
    recentShipments: shipments,
    blockchainVerification: {
      totalRecords: blockchainRecords.length,
      latestTxHash: blockchainRecords[0]?.txHash || null,
      records: blockchainRecords
    }
  });
};

module.exports = { generateQR, scanQR };

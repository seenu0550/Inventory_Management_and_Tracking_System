const User = require('../models/User');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const Shipment = require('../models/Shipment');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const AuditLog = require('../models/AuditLog');

// Users
const getAllUsers = async (req, res) => {
  const { role, isActive } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  const users = await User.find(filter).select('-password');
  res.json(users);
};

const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, role, isActive, walletAddress } = req.body;
  if (name) user.name = name;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (walletAddress) user.walletAddress = walletAddress;
  await user.save();
  res.json(user);
};

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = false;
  await user.save();
  res.json({ message: 'User deactivated' });
};

// Products
const adminGetAllProducts = async (req, res) => {
  const products = await Product.find()
    .populate('createdBy', 'name email')
    .populate('supplier', 'name email');
  res.json(products);
};

const adminUpdateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const adminDeleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.status = 'discontinued';
  await product.save();
  res.json({ message: 'Product discontinued' });
};

// Inventory
const adminGetInventory = async (req, res) => {
  const inventory = await Inventory.find()
    .populate('product', 'name productId category')
    .populate('lastUpdatedBy', 'name');
  res.json(inventory);
};

// Blockchain monitoring
const monitorBlockchain = async (req, res) => {
  const { status, eventType } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (eventType) filter.eventType = eventType;

  const transactions = await BlockchainTransaction.find(filter)
    .populate('initiatedBy', 'name email role')
    .sort({ createdAt: -1 });

  const stats = await BlockchainTransaction.aggregate([
    { $group: { _id: '$eventType', count: { $sum: 1 } } }
  ]);

  res.json({ transactions, stats });
};

const verifySuspiciousTransaction = async (req, res) => {
  const tx = await BlockchainTransaction.findById(req.params.id).populate('initiatedBy', 'name email role');
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });

  // Flag or unflag suspicious transaction
  tx.status = req.body.status || tx.status;
  tx.metadata = { ...tx.metadata, reviewedBy: req.user._id, reviewNote: req.body.note, reviewedAt: new Date() };
  await tx.save();

  res.json({ message: 'Transaction reviewed', transaction: tx });
};

// System overview
const getSystemOverview = async (req, res) => {
  const [users, products, shipments, blockchainTx, recentLogs] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Shipment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    BlockchainTransaction.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name role')
  ]);

  res.json({ users, products, shipments, blockchainTx, recentLogs });
};

module.exports = {
  getAllUsers, updateUser, deleteUser,
  adminGetAllProducts, adminUpdateProduct, adminDeleteProduct,
  adminGetInventory, monitorBlockchain, verifySuspiciousTransaction, getSystemOverview
};

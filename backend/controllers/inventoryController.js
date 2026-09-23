const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

const addStock = async (req, res) => {
  const { productId, warehouse, quantity, lowStockThreshold } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  let inventory = await Inventory.findOne({ product: productId, warehouse });

  if (inventory) {
    inventory.quantity += quantity;
    if (lowStockThreshold !== undefined) inventory.lowStockThreshold = lowStockThreshold;
    inventory.lastUpdatedBy = req.user._id;
    await inventory.save();
  } else {
    inventory = await Inventory.create({
      product: productId,
      warehouse,
      quantity,
      lowStockThreshold: lowStockThreshold || 10,
      lastUpdatedBy: req.user._id
    });
  }

  res.status(201).json(inventory);
};

const updateStock = async (req, res) => {
  const { quantity, lowStockThreshold } = req.body;
  const inventory = await Inventory.findById(req.params.id);
  if (!inventory) return res.status(404).json({ message: 'Inventory record not found' });

  if (quantity !== undefined) inventory.quantity = quantity;
  if (lowStockThreshold !== undefined) inventory.lowStockThreshold = lowStockThreshold;
  inventory.lastUpdatedBy = req.user._id;
  await inventory.save();
  res.json(inventory);
};

const removeStock = async (req, res) => {
  const { productId, warehouse, quantity } = req.body;
  const inventory = await Inventory.findOne({ product: productId, warehouse });
  if (!inventory) return res.status(404).json({ message: 'Inventory record not found' });
  if (inventory.quantity < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  inventory.quantity -= quantity;
  inventory.lastUpdatedBy = req.user._id;
  await inventory.save();
  res.json(inventory);
};

const getInventory = async (req, res) => {
  const { warehouse, productId } = req.query;
  const filter = {};
  if (warehouse) filter.warehouse = warehouse;
  if (productId) filter.product = productId;

  const inventory = await Inventory.find(filter).populate('product', 'name productId category unit').populate('lastUpdatedBy', 'name');
  res.json(inventory);
};

const getLowStockAlerts = async (req, res) => {
  const inventory = await Inventory.find().populate('product', 'name productId category');
  const lowStock = inventory.filter(i => i.quantity <= i.lowStockThreshold);
  res.json(lowStock);
};

const getStockByWarehouse = async (req, res) => {
  const summary = await Inventory.aggregate([
    { $group: { _id: '$warehouse', totalItems: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } }
  ]);
  res.json(summary);
};

module.exports = { addStock, updateStock, removeStock, getInventory, getLowStockAlerts, getStockByWarehouse };

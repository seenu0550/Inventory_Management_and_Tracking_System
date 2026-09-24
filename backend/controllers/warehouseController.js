const { validationResult } = require('express-validator');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');

const createWarehouse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (await Warehouse.findOne({ name: req.body.name }))
    return res.status(400).json({ message: 'Warehouse with this name already exists' });

  const warehouse = await Warehouse.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(warehouse);
};

const getAllWarehouses = async (req, res) => {
  const warehouses = await Warehouse.find().populate('manager', 'name email').populate('createdBy', 'name');
  res.json(warehouses);
};

const getWarehouseById = async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id).populate('manager', 'name email');
  if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
  res.json(warehouse);
};

const updateWarehouse = async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
  Object.assign(warehouse, req.body);
  await warehouse.save();
  res.json(warehouse);
};

const deleteWarehouse = async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);
  if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
  warehouse.isActive = false;
  await warehouse.save();
  res.json({ message: 'Warehouse deactivated' });
};

const transferStock = async (req, res) => {
  const { productId, fromWarehouse, toWarehouse, quantity } = req.body;

  const source = await Inventory.findOne({ product: productId, warehouse: fromWarehouse });
  if (!source) return res.status(404).json({ message: 'Source inventory not found' });
  if (source.quantity < quantity) return res.status(400).json({ message: 'Insufficient stock in source warehouse' });

  source.quantity -= quantity;
  source.lastUpdatedBy = req.user._id;
  await source.save();

  let destination = await Inventory.findOne({ product: productId, warehouse: toWarehouse });
  if (destination) {
    destination.quantity += quantity;
    destination.lastUpdatedBy = req.user._id;
    await destination.save();
  } else {
    destination = await Inventory.create({
      product: productId,
      warehouse: toWarehouse,
      quantity,
      lastUpdatedBy: req.user._id
    });
  }

  res.json({ message: 'Stock transferred successfully', source, destination });
};

const getWarehouseInventoryReport = async (req, res) => {
  const { name } = req.params;
  const inventory = await Inventory.find({ warehouse: name })
    .populate('product', 'name productId category unit price');

  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockItems = inventory.filter(i => i.quantity <= i.lowStockThreshold);

  res.json({ warehouse: name, totalItems, totalQuantity, lowStockItems: lowStockItems.length, inventory });
};

module.exports = {
  createWarehouse, getAllWarehouses, getWarehouseById, updateWarehouse,
  deleteWarehouse, transferStock, getWarehouseInventoryReport
};

const { validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');

const createSupplier = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (await Supplier.findOne({ email: req.body.email }))
    return res.status(400).json({ message: 'Supplier with this email already exists' });

  const supplier = await Supplier.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(supplier);
};

const getAllSuppliers = async (req, res) => {
  const suppliers = await Supplier.find().populate('products', 'name productId').populate('createdBy', 'name');
  res.json(suppliers);
};

const getSupplierById = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id)
    .populate('products', 'name productId category price')
    .populate('purchaseOrders.product', 'name productId')
    .populate('purchaseOrders.orderedBy', 'name');
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(supplier);
};

const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  Object.assign(supplier, req.body);
  await supplier.save();
  res.json(supplier);
};

const deleteSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  supplier.isActive = false;
  await supplier.save();
  res.json({ message: 'Supplier deactivated' });
};

const addProductToSupplier = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

  const { productId } = req.body;
  if (supplier.products.includes(productId))
    return res.status(400).json({ message: 'Product already linked to this supplier' });

  supplier.products.push(productId);
  await supplier.save();
  res.json(supplier);
};

const createPurchaseOrder = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

  const { product, quantity, unitPrice } = req.body;
  supplier.purchaseOrders.push({ product, quantity, unitPrice, orderedBy: req.user._id });
  await supplier.save();
  res.status(201).json(supplier.purchaseOrders[supplier.purchaseOrders.length - 1]);
};

const updatePurchaseOrderStatus = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

  const order = supplier.purchaseOrders.id(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Purchase order not found' });

  order.status = req.body.status;
  if (req.body.status === 'delivered') order.deliveredAt = new Date();
  await supplier.save();
  res.json(order);
};

const getTransactionHistory = async (req, res) => {
  const supplier = await Supplier.findById(req.params.id)
    .select('purchaseOrders')
    .populate('purchaseOrders.product', 'name productId');
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(supplier.purchaseOrders);
};

module.exports = {
  createSupplier, getAllSuppliers, getSupplierById, updateSupplier,
  deleteSupplier, addProductToSupplier, createPurchaseOrder,
  updatePurchaseOrderStatus, getTransactionHistory
};

const { validationResult } = require('express-validator');
const Product = require('../models/Product');

const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(product);
};

const getAllProducts = async (req, res) => {
  const { category, status, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const products = await Product.find(filter).populate('createdBy', 'name email').populate('supplier', 'name email');
  res.json(products);
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('createdBy', 'name email').populate('supplier', 'name email');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  Object.assign(product, req.body);
  await product.save();
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  product.status = 'discontinued';
  await product.save();
  res.json({ message: 'Product discontinued' });
};

const getCategories = async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories);
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getCategories };

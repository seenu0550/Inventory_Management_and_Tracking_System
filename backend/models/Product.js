const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const productSchema = new mongoose.Schema({
  productId: { type: String, default: () => `PROD-${uuidv4().slice(0, 8).toUpperCase()}`, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: String, required: true },
  sku: { type: String, unique: true, sparse: true },
  batchNumber: { type: String },
  unit: { type: String, default: 'pcs' },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

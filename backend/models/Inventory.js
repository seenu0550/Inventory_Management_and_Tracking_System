const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });

inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.lowStockThreshold;
});

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);

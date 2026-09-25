const mongoose = require('mongoose');

const blockchainTransactionSchema = new mongoose.Schema({
  txHash: { type: String, required: true, unique: true },
  blockNumber: { type: Number },
  eventType: {
    type: String,
    enum: ['product_registered', 'inventory_transfer', 'inventory_received', 'ownership_transfer', 'shipment_created', 'shipment_received'],
    required: true
  },
  referenceId: { type: String },
  referenceModel: { type: String, enum: ['Product', 'Shipment', 'Inventory'] },
  dataHash: { type: String },
  fromAddress: { type: String },
  toAddress: { type: String },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'confirmed' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('BlockchainTransaction', blockchainTransactionSchema);

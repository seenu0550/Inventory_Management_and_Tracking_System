const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String },
  note: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, default: () => `SHIP-${uuidv4().slice(0, 8).toUpperCase()}`, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'in_transit', 'received', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [statusHistorySchema],
  dispatchedAt: { type: Date },
  receivedAt: { type: Date },
  blockchainTxHash: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);

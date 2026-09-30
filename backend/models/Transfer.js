const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const transferSchema = new mongoose.Schema({
  transferId: { type: String, default: () => `TRF-${uuidv4().slice(0, 8).toUpperCase()}`, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  fromWarehouse: { type: String, required: true },
  toWarehouse: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'confirmed_by_sender', 'confirmed_by_receiver', 'completed', 'cancelled'], default: 'pending' },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedBySender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedByReceiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  blockchainTxHash: { type: String },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transfer', transferSchema);

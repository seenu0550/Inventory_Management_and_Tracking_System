const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['low_stock', 'shipment_update', 'transfer_initiated', 'transfer_confirmed', 'product_verification', 'receiving_confirmation'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referenceId: { type: String },
  referenceModel: { type: String, enum: ['Product', 'Shipment', 'Inventory', 'Transfer'] },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

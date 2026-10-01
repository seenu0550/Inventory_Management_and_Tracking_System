const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  method: { type: String },
  endpoint: { type: String },
  referenceId: { type: String },
  referenceModel: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['success', 'failed'], default: 'success' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

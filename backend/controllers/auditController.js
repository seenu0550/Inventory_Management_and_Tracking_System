const AuditLog = require('../models/AuditLog');

const getAllLogs = async (req, res) => {
  const { userId, action, referenceModel, startDate, endDate, status } = req.query;
  const filter = {};

  if (userId) filter.user = userId;
  if (action) filter.action = { $regex: action, $options: 'i' };
  if (referenceModel) filter.referenceModel = referenceModel;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(filter)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(200);

  res.json(logs);
};

const getMyActivity = async (req, res) => {
  const logs = await AuditLog.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(logs);
};

const getLogById = async (req, res) => {
  const log = await AuditLog.findById(req.params.id).populate('user', 'name email role');
  if (!log) return res.status(404).json({ message: 'Log not found' });
  res.json(log);
};

module.exports = { getAllLogs, getMyActivity, getLogById };

const Notification = require('../models/Notification');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

const getMyNotifications = async (req, res) => {
  const { unread } = req.query;
  const filter = { recipient: req.user._id };
  if (unread === 'true') filter.isRead = false;
  const notifications = await Notification.find(filter).sort({ createdAt: -1 });
  res.json(notifications);
};

const markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: 'Notification marked as read' });
};

const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
};

const getLowStockAlerts = async (req, res) => {
  const inventory = await Inventory.find().populate('product', 'name productId category');
  const alerts = inventory
    .filter(i => i.quantity <= i.lowStockThreshold)
    .map(i => ({
      product: i.product,
      warehouse: i.warehouse,
      quantity: i.quantity,
      threshold: i.lowStockThreshold,
      severity: i.quantity === 0 ? 'critical' : 'warning'
    }));
  res.json(alerts);
};

const sendNotification = async (recipientId, type, title, message, referenceId, referenceModel) => {
  await Notification.create({ type, title, message, recipient: recipientId, referenceId, referenceModel });
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, getLowStockAlerts, sendNotification };

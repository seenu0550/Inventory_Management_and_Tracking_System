const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Shipment = require('../models/Shipment');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const Transfer = require('../models/Transfer');

const getDashboard = async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    totalInventory,
    lowStockItems,
    activeShipments,
    totalSuppliers,
    totalWarehouses,
    totalBlockchainTx,
    recentTransactions,
    recentShipments,
    inventoryByCategory,
    inventoryByWarehouse,
    blockchainByEvent
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Inventory.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]),
    Inventory.find().then(inv => inv.filter(i => i.quantity <= i.lowStockThreshold).length),
    Shipment.countDocuments({ status: { $in: ['pending', 'dispatched', 'in_transit'] } }),
    Supplier.countDocuments({ isActive: true }),
    Warehouse.countDocuments({ isActive: true }),
    BlockchainTransaction.countDocuments(),
    BlockchainTransaction.find().sort({ createdAt: -1 }).limit(5).populate('initiatedBy', 'name'),
    Shipment.find().sort({ createdAt: -1 }).limit(5).populate('product', 'name productId'),
    Inventory.aggregate([
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', totalQuantity: { $sum: '$quantity' }, totalItems: { $sum: 1 } } }
    ]),
    Inventory.aggregate([
      { $group: { _id: '$warehouse', totalQuantity: { $sum: '$quantity' }, totalItems: { $sum: 1 } } }
    ]),
    BlockchainTransaction.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ])
  ]);

  res.json({
    overview: {
      totalProducts,
      activeProducts,
      totalInventory: totalInventory[0]?.total || 0,
      lowStockItems,
      activeShipments,
      totalSuppliers,
      totalWarehouses,
      totalBlockchainTx
    },
    recentTransactions,
    recentShipments,
    inventoryByCategory,
    inventoryByWarehouse,
    blockchainByEvent
  });
};

module.exports = { getDashboard };

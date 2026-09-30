const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Shipment = require('../models/Shipment');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');
const BlockchainTransaction = require('../models/BlockchainTransaction');

const getInventoryReport = async (req, res) => {
  const inventory = await Inventory.find()
    .populate('product', 'name productId category unit price')
    .populate('lastUpdatedBy', 'name');
  res.json(inventory);
};

const getShipmentReport = async (req, res) => {
  const { startDate, endDate, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  const shipments = await Shipment.find(filter)
    .populate('product', 'name productId')
    .populate('supplier', 'name')
    .populate('createdBy', 'name');
  res.json(shipments);
};

const getSupplierReport = async (req, res) => {
  const suppliers = await Supplier.find()
    .populate('products', 'name productId price')
    .select('-purchaseOrders');
  res.json(suppliers);
};

const getWarehouseReport = async (req, res) => {
  const warehouses = await Warehouse.find().populate('manager', 'name email');
  const inventorySummary = await Inventory.aggregate([
    { $group: { _id: '$warehouse', totalQuantity: { $sum: '$quantity' }, totalItems: { $sum: 1 } } }
  ]);
  const summaryMap = Object.fromEntries(inventorySummary.map(i => [i._id, i]));
  const report = warehouses.map(w => ({ ...w.toJSON(), inventory: summaryMap[w.name] || { totalQuantity: 0, totalItems: 0 } }));
  res.json(report);
};

const getBlockchainReport = async (req, res) => {
  const { eventType } = req.query;
  const filter = eventType ? { eventType } : {};
  const transactions = await BlockchainTransaction.find(filter)
    .populate('initiatedBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(transactions);
};

const exportInventoryPDF = async (req, res) => {
  const inventory = await Inventory.find().populate('product', 'name productId category unit');

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.pdf');
  doc.pipe(res);

  doc.fontSize(18).text('Inventory Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  inventory.forEach(item => {
    doc.fontSize(11).text(`Product: ${item.product?.name} (${item.product?.productId})`);
    doc.fontSize(10).text(`  Warehouse: ${item.warehouse} | Qty: ${item.quantity} | Low Stock: ${item.isLowStock ? 'YES' : 'NO'}`);
    doc.moveDown(0.5);
  });

  doc.end();
};

const exportInventoryExcel = async (req, res) => {
  const inventory = await Inventory.find().populate('product', 'name productId category unit price');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventory');

  sheet.columns = [
    { header: 'Product ID', key: 'productId', width: 15 },
    { header: 'Product Name', key: 'name', width: 25 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Warehouse', key: 'warehouse', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Low Stock', key: 'lowStock', width: 10 }
  ];

  inventory.forEach(item => {
    sheet.addRow({
      productId: item.product?.productId,
      name: item.product?.name,
      category: item.product?.category,
      warehouse: item.warehouse,
      quantity: item.quantity,
      unit: item.product?.unit,
      lowStock: item.isLowStock ? 'YES' : 'NO'
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
};

const exportShipmentExcel = async (req, res) => {
  const shipments = await Shipment.find().populate('product', 'name productId');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Shipments');

  sheet.columns = [
    { header: 'Shipment ID', key: 'shipmentId', width: 20 },
    { header: 'Product', key: 'product', width: 25 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Source', key: 'source', width: 20 },
    { header: 'Destination', key: 'destination', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 20 }
  ];

  shipments.forEach(s => {
    sheet.addRow({
      shipmentId: s.shipmentId,
      product: s.product?.name,
      quantity: s.quantity,
      source: s.source,
      destination: s.destination,
      status: s.status,
      createdAt: s.createdAt?.toLocaleDateString()
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=shipment-report.xlsx');
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = { getInventoryReport, getShipmentReport, getSupplierReport, getWarehouseReport, getBlockchainReport, exportInventoryPDF, exportInventoryExcel, exportShipmentExcel };

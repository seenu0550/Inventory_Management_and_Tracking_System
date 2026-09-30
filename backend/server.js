require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/warehouses', require('./routes/warehouseRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes'));
app.use('/api/blockchain', require('./routes/blockchainRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));
app.use('/api/tamper', require('./routes/tamperRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

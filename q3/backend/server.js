const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

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
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CartCraft API', rollN: process.env.ROLL_N || 671 });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CartCraft Backend running on port ${PORT}`);
});

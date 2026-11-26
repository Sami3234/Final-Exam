require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Idempotency = require('../models/Idempotency');

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cartcraft');
  console.log('Clearing old data...');
  await User.deleteMany({});
  await Product.deleteMany({});
  await Cart.deleteMany({});
  await Order.deleteMany({});
  await Idempotency.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const admin = await User.create({
    name: 'Muhammad Sami Ullah (Admin)',
    email: 'admin@cartcraft.com',
    password: passwordHash,
    role: 'admin'
  });

  const customer = await User.create({
    name: 'Customer One',
    email: 'customer@cartcraft.com',
    password: passwordHash,
    role: 'customer'
  });

  const customer2 = await User.create({
    name: 'Customer Two',
    email: 'customer2@cartcraft.com',
    password: passwordHash,
    role: 'customer'
  });

  const products = await Product.create([
    { name: 'Mechanical Keyboard Pro', price: 450, stock: 15 },
    { name: 'Ergonomic Gaming Mouse', price: 250, stock: 20 },
    { name: 'USB-C Fast Charging Hub', price: 150, stock: 30 },
    { name: 'Limited Collector Edition Headphones', price: 1200, stock: 2 },
    { name: 'Ultra-Wide 4K Gaming Monitor', price: 1800, stock: 5 }
  ]);

  console.log('Seeding completed successfully!');
  console.log(`Admin created: ${admin.email}`);
  console.log(`Customer created: ${customer.email} (Password: password123)`);
  console.log(`Customer 2 created: ${customer2.email} (Password: password123)`);
  console.log(`Products seeded: ${products.length}`);
  console.log(`Roll Number: HM-2025-1010-671 (N = 671)`);
  console.log(`Flat Shipping Fee = 50 + 671 = 721`);
  console.log(`Free Shipping Threshold = 1000 + 671 = 1671`);

  await mongoose.disconnect();
};

seedData().catch(err => {
  console.error(err);
  process.exit(1);
});

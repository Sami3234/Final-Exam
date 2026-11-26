const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const catalog = await Product.find().sort({ createdAt: -1 });
    return res.json(catalog);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Product title, unit price, and initial stock are mandatory' });
    }

    const sanitizedPrice = Math.round(Number(price));
    const sanitizedStock = Math.round(Number(stock));

    if (sanitizedPrice < 0 || sanitizedStock < 0) {
      return res.status(400).json({ message: 'Values for price and stock must be non-negative integers' });
    }

    const createdRecord = await Product.create({
      name: name.trim(),
      price: sanitizedPrice,
      stock: sanitizedStock
    });

    return res.status(201).json(createdRecord);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

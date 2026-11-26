const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Name, price, and stock are required' });
    }

    const numPrice = Math.round(Number(price));
    const numStock = Math.round(Number(stock));

    if (numPrice < 0 || numStock < 0) {
      return res.status(400).json({ message: 'Price and stock cannot be negative' });
    }

    const product = await Product.create({
      name,
      price: numPrice,
      stock: numStock
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

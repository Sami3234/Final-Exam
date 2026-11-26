const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { computeShipping, getShippingPolicy } = require('../services/shippingService');

exports.getCart = async (req, res) => {
  try {
    let userCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!userCart) {
      userCart = await Cart.create({ user: req.user._id, items: [] });
    }

    const cartEntries = [];
    let subtotalAmount = 0;

    for (const row of userCart.items) {
      if (row.product) {
        const linePrice = row.product.price * row.quantity;
        subtotalAmount += linePrice;
        cartEntries.push({
          product: {
            _id: row.product._id,
            name: row.product.name,
            price: row.product.price,
            stock: row.product.stock
          },
          quantity: row.quantity,
          itemTotal: linePrice
        });
      }
    }

    const shippingCharge = computeShipping(subtotalAmount, cartEntries.length);
    const grandTotal = subtotalAmount + shippingCharge;

    return res.json({
      items: cartEntries,
      subtotal: subtotalAmount,
      shipping: shippingCharge,
      total: grandTotal,
      rules: getShippingPolicy()
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const requestedUnits = parseInt(quantity, 10);

    if (!productId || isNaN(requestedUnits) || requestedUnits <= 0) {
      return res.status(400).json({ message: 'A valid product ID and positive whole quantity are required' });
    }

    const productRecord = await Product.findById(productId);
    if (!productRecord) {
      return res.status(404).json({ message: 'Requested product does not exist' });
    }

    let userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      userCart = new Cart({ user: req.user._id, items: [] });
    }

    const existingMatch = userCart.items.find(item => item.product.toString() === productId);
    const alreadyInCart = existingMatch ? existingMatch.quantity : 0;
    const aggregateUnits = alreadyInCart + requestedUnits;

    if (aggregateUnits > productRecord.stock) {
      return res.status(400).json({
        message: `Stock limit reached. Available: ${productRecord.stock}, currently in bag: ${alreadyInCart}`
      });
    }

    if (existingMatch) {
      existingMatch.quantity = aggregateUnits;
    } else {
      userCart.items.push({ product: productId, quantity: requestedUnits });
    }

    await userCart.save();
    return exports.getCart(req, res);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const targetQty = parseInt(req.body.quantity, 10);

    if (isNaN(targetQty) || targetQty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1 unit' });
    }

    const itemDoc = await Product.findById(productId);
    if (!itemDoc) {
      return res.status(404).json({ message: 'Product record missing' });
    }

    if (targetQty > itemDoc.stock) {
      return res.status(400).json({ message: `Cannot set quantity to ${targetQty}. Only ${itemDoc.stock} in stock` });
    }

    const cartDoc = await Cart.findOne({ user: req.user._id });
    if (!cartDoc) {
      return res.status(404).json({ message: 'Cart not initialized' });
    }

    const match = cartDoc.items.find(entry => entry.product.toString() === productId);
    if (!match) {
      return res.status(404).json({ message: 'Item not present in cart' });
    }

    match.quantity = targetQty;
    await cartDoc.save();

    return exports.getCart(req, res);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userCart = await Cart.findOne({ user: req.user._id });
    if (userCart) {
      userCart.items = userCart.items.filter(entry => entry.product.toString() !== productId);
      await userCart.save();
    }
    return exports.getCart(req, res);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
    return res.json({ message: 'Bag cleared successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

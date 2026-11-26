const Cart = require('../models/Cart');
const Product = require('../models/Product');

const N = Number(process.env.ROLL_N) || 671;
const FLAT_SHIPPING = 50 + N;
const FREE_SHIPPING_THRESHOLD = 1000 + N;

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const items = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (item.product) {
        const itemTotal = item.product.price * item.quantity;
        subtotal += itemTotal;
        items.push({
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            stock: item.product.stock
          },
          quantity: item.quantity,
          itemTotal
        });
      }
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : FLAT_SHIPPING;
    const total = subtotal + shipping;

    res.json({
      items,
      subtotal,
      shipping,
      total,
      rules: {
        flatShipping: FLAT_SHIPPING,
        freeThreshold: FREE_SHIPPING_THRESHOLD,
        rollN: N
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.floor(Number(quantity));

    if (!productId || isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Valid productId and quantity (>= 1) are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(item => item.product.toString() === productId);
    const currentQtyInCart = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    const targetQty = currentQtyInCart + qty;

    if (targetQty > product.stock) {
      return res.status(400).json({
        message: `Cannot add ${qty}. Current stock is ${product.stock}, you already have ${currentQtyInCart} in cart.`
      });
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = targetQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    return exports.getCart(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = Math.floor(Number(quantity));

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be a positive integer (>= 1)' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (qty > product.stock) {
      return res.status(400).json({ message: `Quantity requested (${qty}) exceeds available stock (${product.stock})` });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();

    return exports.getCart(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      await cart.save();
    }
    return exports.getCart(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Idempotency = require('../models/Idempotency');

const N = Number(process.env.ROLL_N) || 671;
const FLAT_SHIPPING = 50 + N;
const FREE_SHIPPING_THRESHOLD = 1000 + N;

exports.checkout = async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ message: 'Idempotency-Key header is required' });
  }

  const existingRequest = await Idempotency.findOne({ key: idempotencyKey, user: req.user._id });
  if (existingRequest) {
    return res.status(existingRequest.status).json(existingRequest.response);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  let session = null;
  let useTransactions = false;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransactions = true;
  } catch (e) {
    session = null;
    useTransactions = false;
  }

  if (useTransactions) {
    try {
      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const product = await Product.findOneAndUpdate(
          { _id: cartItem.product, stock: { $gte: cartItem.quantity } },
          { $inc: { stock: -cartItem.quantity } },
          { session, new: true }
        );

        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Checkout failed: Insufficient stock for product ID ${cartItem.product}. No stock was deducted.`
          });
        }

        const itemSubtotal = product.price * cartItem.quantity;
        subtotal += itemSubtotal;
        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: cartItem.quantity,
          price: product.price
        });
      }

      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
      const total = subtotal + shipping;

      const [order] = await Order.create(
        [{
          user: req.user._id,
          items: orderItems,
          subtotal,
          shipping,
          total,
          status: 'placed',
          idempotencyKey
        }],
        { session }
      );

      await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } }, { session });

      const responsePayload = {
        message: 'Order placed successfully',
        order
      };

      await Idempotency.create(
        [{
          key: idempotencyKey,
          user: req.user._id,
          orderId: order._id,
          response: responsePayload,
          status: 201
        }],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json(responsePayload);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: 'Checkout transaction error: ' + error.message });
    }
  }

  const reserved = [];
  try {
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findOneAndUpdate(
        { _id: cartItem.product, stock: { $gte: cartItem.quantity } },
        { $inc: { stock: -cartItem.quantity } },
        { new: true }
      );

      if (!product) {
        for (const r of reserved) {
          await Product.findByIdAndUpdate(r.productId, { $inc: { stock: r.qty } });
        }
        return res.status(400).json({
          message: `Checkout failed: Insufficient stock for product ID ${cartItem.product}. All reserved stock was restored.`
        });
      }

      reserved.push({ productId: product._id, qty: cartItem.quantity });
      const itemSubtotal = product.price * cartItem.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        price: product.price
      });
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    const total = subtotal + shipping;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      shipping,
      total,
      status: 'placed',
      idempotencyKey
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

    const responsePayload = {
      message: 'Order placed successfully',
      order
    };

    await Idempotency.create({
      key: idempotencyKey,
      user: req.user._id,
      orderId: order._id,
      response: responsePayload,
      status: 201
    });

    return res.status(201).json(responsePayload);
  } catch (error) {
    for (const r of reserved) {
      await Product.findByIdAndUpdate(r.productId, { $inc: { stock: r.qty } });
    }
    return res.status(500).json({ message: 'Checkout error: ' + error.message });
  }
};

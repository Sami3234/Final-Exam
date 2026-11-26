const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Idempotency = require('../models/Idempotency');
const { computeShipping } = require('../services/shippingService');

exports.checkout = async (req, res) => {
  const idempotencyHeader = req.headers['idempotency-key'];
  if (!idempotencyHeader) {
    return res.status(400).json({ message: 'Missing required Idempotency-Key in request header' });
  }

  const cachedTransaction = await Idempotency.findOne({
    key: idempotencyHeader,
    user: req.user._id
  });

  if (cachedTransaction) {
    return res.status(cachedTransaction.status).json(cachedTransaction.response);
  }

  const customerCart = await Cart.findOne({ user: req.user._id });
  if (!customerCart || customerCart.items.length === 0) {
    return res.status(400).json({ message: 'Checkout halted: Shopping bag is empty' });
  }

  let dbSession = null;
  let supportsTransactions = false;

  try {
    dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    supportsTransactions = true;
  } catch (initErr) {
    dbSession = null;
    supportsTransactions = false;
  }

  if (supportsTransactions) {
    try {
      const lineSummary = [];
      let calculatedSubtotal = 0;

      for (const cartRow of customerCart.items) {
        const productSnapshot = await Product.findOneAndUpdate(
          { _id: cartRow.product, stock: { $gte: cartRow.quantity } },
          { $inc: { stock: -cartRow.quantity } },
          { session: dbSession, new: true }
        );

        if (!productSnapshot) {
          await dbSession.abortTransaction();
          dbSession.endSession();
          return res.status(400).json({
            message: `Checkout aborted: Stock unavailable for product ID ${cartRow.product}. Zero units were deducted.`
          });
        }

        const lineCost = productSnapshot.price * cartRow.quantity;
        calculatedSubtotal += lineCost;

        lineSummary.push({
          product: productSnapshot._id,
          name: productSnapshot.name,
          quantity: cartRow.quantity,
          price: productSnapshot.price
        });
      }

      const calculatedShipping = computeShipping(calculatedSubtotal, lineSummary.length);
      const invoiceTotal = calculatedSubtotal + calculatedShipping;

      const [newOrder] = await Order.create(
        [{
          user: req.user._id,
          items: lineSummary,
          subtotal: calculatedSubtotal,
          shipping: calculatedShipping,
          total: invoiceTotal,
          status: 'placed',
          idempotencyKey: idempotencyHeader
        }],
        { session: dbSession }
      );

      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $set: { items: [] } },
        { session: dbSession }
      );

      const successEnvelope = {
        message: 'Order placed successfully',
        order: newOrder
      };

      await Idempotency.create(
        [{
          key: idempotencyHeader,
          user: req.user._id,
          orderId: newOrder._id,
          response: successEnvelope,
          status: 201
        }],
        { session: dbSession }
      );

      await dbSession.commitTransaction();
      dbSession.endSession();

      return res.status(201).json(successEnvelope);
    } catch (txnError) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      return res.status(500).json({ message: 'Transaction failure: ' + txnError.message });
    }
  }

  const rollbackHoldings = [];
  try {
    const lineSummary = [];
    let calculatedSubtotal = 0;

    for (const cartRow of customerCart.items) {
      const productSnapshot = await Product.findOneAndUpdate(
        { _id: cartRow.product, stock: { $gte: cartRow.quantity } },
        { $inc: { stock: -cartRow.quantity } },
        { new: true }
      );

      if (!productSnapshot) {
        for (const item of rollbackHoldings) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.units } });
        }
        return res.status(400).json({
          message: `Checkout aborted: Stock unavailable for product ID ${cartRow.product}. All reserved stock was restored.`
        });
      }

      rollbackHoldings.push({ productId: productSnapshot._id, units: cartRow.quantity });
      const lineCost = productSnapshot.price * cartRow.quantity;
      calculatedSubtotal += lineCost;

      lineSummary.push({
        product: productSnapshot._id,
        name: productSnapshot.name,
        quantity: cartRow.quantity,
        price: productSnapshot.price
      });
    }

    const calculatedShipping = computeShipping(calculatedSubtotal, lineSummary.length);
    const invoiceTotal = calculatedSubtotal + calculatedShipping;

    const newOrder = await Order.create({
      user: req.user._id,
      items: lineSummary,
      subtotal: calculatedSubtotal,
      shipping: calculatedShipping,
      total: invoiceTotal,
      status: 'placed',
      idempotencyKey: idempotencyHeader
    });

    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

    const successEnvelope = {
      message: 'Order placed successfully',
      order: newOrder
    };

    await Idempotency.create({
      key: idempotencyHeader,
      user: req.user._id,
      orderId: newOrder._id,
      response: successEnvelope,
      status: 201
    });

    return res.status(201).json(successEnvelope);
  } catch (procErr) {
    for (const item of rollbackHoldings) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.units } });
    }
    return res.status(500).json({ message: 'Checkout execution failed: ' + procErr.message });
  }
};

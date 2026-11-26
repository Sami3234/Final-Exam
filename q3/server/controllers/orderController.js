const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const query = { _id: req.params.id, status: 'placed' };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOneAndUpdate(
      query,
      { $set: { status: 'cancelled' } },
      { new: false }
    );

    if (!order) {
      return res.status(400).json({
        message: 'Order cannot be cancelled. It may not exist, is not yours, or is already cancelled.'
      });
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully and stock restored exactly once',
      orderId: order._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

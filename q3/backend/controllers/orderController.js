const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getMyOrders = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const customerOrders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return res.json(customerOrders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const orderDoc = await Order.findById(req.params.id);
    if (!orderDoc) {
      return res.status(404).json({ message: 'Requested order could not be located' });
    }

    const belongsToCaller = orderDoc.user.toString() === req.user._id.toString();
    const hasAdminPrivilege = req.user.role === 'admin';

    if (!belongsToCaller && !hasAdminPrivilege) {
      return res.status(403).json({ message: 'Access forbidden: You cannot view orders placed by other accounts' });
    }

    return res.json(orderDoc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const criteria = { _id: req.params.id, status: 'placed' };
    if (req.user.role !== 'admin') {
      criteria.user = req.user._id;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      criteria,
      { $set: { status: 'cancelled' } },
      { new: false }
    );

    if (!updatedOrder) {
      return res.status(400).json({
        message: 'Order cancellation rejected: Order either does not exist, belongs to another user, or was previously cancelled.'
      });
    }

    for (const line of updatedOrder.items) {
      await Product.findByIdAndUpdate(
        line.product,
        { $inc: { stock: line.quantity } }
      );
    }

    return res.json({
      success: true,
      message: 'Order successfully cancelled and items restocked exactly once',
      orderId: updatedOrder._id
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

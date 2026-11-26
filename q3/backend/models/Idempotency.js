const mongoose = require('mongoose');

const idempotencySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  response: { type: Object, required: true },
  status: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Idempotency', idempotencySchema);

const express = require('express');
const router = express.Router();
const { getMyOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const { checkout } = require('../controllers/checkoutController');
const { protect } = require('../middleware/auth');

router.post('/', protect, checkout);

module.exports = router;

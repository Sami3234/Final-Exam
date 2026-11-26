const http = require('http');

const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runTest = async () => {
  console.log('==================================================');
  console.log('TEST: All-or-Nothing Stock on Low Stock Failure');
  console.log('==================================================\n');

  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'customer2@cartcraft.com', password: 'password123' });

  const token = loginRes.body.token;
  const prodRes = await request({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET' });

  const normalItem = prodRes.body.find(p => p.name.includes('Ergonomic Gaming Mouse'));
  const limitedItem = prodRes.body.find(p => p.name.includes('Limited Collector Edition Headphones'));

  console.log(`Item 1 (${normalItem.name}) Initial Stock: ${normalItem.stock}`);
  console.log(`Item 2 (${limitedItem.name}) Initial Stock: ${limitedItem.stock}`);

  await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cart',
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cart',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { productId: normalItem._id, quantity: 1 });

  await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cart',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { productId: limitedItem._id, quantity: 1 });

  await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/cart/${limitedItem._id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { quantity: limitedItem.stock + 5 });

  console.log('\n--- Attempting Checkout with Quantity exceeding Stock ---');
  const checkoutRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/checkout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': 'fail-test-' + Date.now()
    }
  });

  console.log(`Checkout Status: ${checkoutRes.status}`);
  console.log(`Server message: ${checkoutRes.body.message}`);

  const prodResAfter = await request({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET' });
  const normalItemAfter = prodResAfter.body.find(p => p._id === normalItem._id);
  const limitedItemAfter = prodResAfter.body.find(p => p._id === limitedItem._id);

  console.log(`Item 1 Stock after failed checkout: ${normalItemAfter.stock} (Initial: ${normalItem.stock})`);
  console.log(`Item 2 Stock after failed checkout: ${limitedItemAfter.stock} (Initial: ${limitedItem.stock})`);

  if (normalItemAfter.stock === normalItem.stock && limitedItemAfter.stock === limitedItem.stock) {
    console.log('\n>>> SUCCESS: All-or-nothing stock verified! No partial stock was deducted.');
  } else {
    console.error('\n>>> FAILURE: Stock was left partially deducted!');
  }
};

runTest().catch(console.error);

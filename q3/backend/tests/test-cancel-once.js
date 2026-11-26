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
  console.log('TEST: Cancel Order Exactly Once');
  console.log('==================================================\n');

  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'customer@cartcraft.com', password: 'password123' });

  const token = loginRes.body.token;

  const ordersRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const activeOrder = ordersRes.body.find(o => o.status === 'placed');
  if (!activeOrder) {
    console.log('No placed order found. Please place an order first or run test:idempotency.');
    return;
  }

  const itemToTrack = activeOrder.items[0];
  const prodResBefore = await request({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET' });
  const productBefore = prodResBefore.body.find(p => p._id === itemToTrack.product);
  console.log(`Product "${productBefore.name}" stock before cancel: ${productBefore.stock}`);
  console.log(`Order ID to cancel: ${activeOrder._id} (Item qty to restore: ${itemToTrack.quantity})`);

  console.log('\n--- First Cancellation Call ---');
  const cancel1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/orders/${activeOrder._id}/cancel`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Call 1 Status: ${cancel1.status}`);
  console.log(`Call 1 Message: ${cancel1.body.message}`);

  console.log('\n--- Second Cancellation Call (Repeated / Double-click) ---');
  const cancel2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/orders/${activeOrder._id}/cancel`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Call 2 Status: ${cancel2.status}`);
  console.log(`Call 2 Message: ${cancel2.body.message}`);

  const prodResAfter = await request({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET' });
  const productAfter = prodResAfter.body.find(p => p._id === itemToTrack.product);
  console.log(`\nProduct stock after repeated cancel: ${productAfter.stock}`);
  console.log(`Expected stock: ${productBefore.stock + itemToTrack.quantity}`);

  if (productAfter.stock === productBefore.stock + itemToTrack.quantity && cancel2.status === 400) {
    console.log('\n>>> SUCCESS: Stock was restored exactly once! Second cancellation was rejected.');
  } else {
    console.error('\n>>> FAILURE: Stock restoration test failed.');
  }
};

runTest().catch(console.error);

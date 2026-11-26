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
  console.log('TEST: Idempotency Key Handling (Double Submit Test)');
  console.log('==================================================\n');

  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'customer@cartcraft.com', password: 'password123' });

  const token = loginRes.body.token;
  if (!token) {
    console.error('Login failed! Make sure the server is running and seeded.');
    return;
  }

  const prodRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET'
  });
  const keyboard = prodRes.body.find(p => p.name.includes('Mechanical Keyboard'));
  console.log(`Initial stock for ${keyboard.name}: ${keyboard.stock}`);

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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { productId: keyboard._id, quantity: 2 });

  const idempotencyKey = 'test-idemp-' + Date.now();
  console.log(`Generated Idempotency-Key: ${idempotencyKey}`);

  console.log('\n--- Sending First Checkout Request ---');
  const res1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/checkout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey
    }
  });

  console.log(`Response 1 Status: ${res1.status}`);
  console.log(`Order ID: ${res1.body.order?._id}`);
  console.log(`Subtotal: ${res1.body.order?.subtotal}, Shipping: ${res1.body.order?.shipping}, Total: ${res1.body.order?.total}`);

  console.log('\n--- Sending Second Checkout Request with Identical Key ---');
  const res2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/checkout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey
    }
  });

  console.log(`Response 2 Status: ${res2.status}`);
  console.log(`Order ID: ${res2.body.order?._id}`);

  const prodResAfter = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET'
  });
  const keyboardAfter = prodResAfter.body.find(p => p.name.includes('Mechanical Keyboard'));
  console.log(`Stock after double checkout: ${keyboardAfter.stock} (Expected: ${keyboard.stock - 2})`);

  if (res1.body.order._id === res2.body.order._id && keyboardAfter.stock === keyboard.stock - 2) {
    console.log('\n>>> SUCCESS: Idempotency verified! No duplicate order created and stock was deducted only once.');
  } else {
    console.error('\n>>> FAILURE: Idempotency check failed.');
  }
};

runTest().catch(console.error);

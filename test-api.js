const http = require('http');

async function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING TESTS ---');
  let token = '';

  // 1. Register and Login
  console.log('\n[1] Registering user...');
  const email = `test${Date.now()}@test.com`;
  const regRes = await request('POST', '/auth/register', {
    email,
    password: 'password123',
    name: 'Test User'
  });
  console.log('Register Response:', regRes.body);

  console.log('[1] Logging in...');
  const loginRes = await request('POST', '/auth/login', {
    email,
    password: 'password123'
  });
  console.log('Login Response:', loginRes.body);
  token = loginRes.body && loginRes.body.access_token;
  if (!token) throw new Error('No token received. Register response was: ' + JSON.stringify(regRes.body));
  console.log('Login successful');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Test Idempotency (POST /v1/todos)
  console.log('\n[2] Testing Idempotency (POST /v1/todos)...');
  const idempotencyKey = `key-${Date.now()}`;
  
  const todo1Res = await request('POST', '/v1/todos', { title: 'Buy milk' }, {
    ...authHeaders,
    'Idempotency-Key': idempotencyKey
  });
  console.log('First request status:', todo1Res.status);

  console.log('Sending second identical request...');
  const todo2Res = await request('POST', '/v1/todos', { title: 'Buy milk' }, {
    ...authHeaders,
    'Idempotency-Key': idempotencyKey
  });
  console.log('Second request status:', todo2Res.status, '- Response matches:', JSON.stringify(todo1Res.body) === JSON.stringify(todo2Res.body));

  console.log('Sending third request with different body but same key...');
  const todo3Res = await request('POST', '/v1/todos', { title: 'Buy bread' }, {
    ...authHeaders,
    'Idempotency-Key': idempotencyKey
  });
  console.log('Third request status:', todo3Res.status); // Should be 409

  // 3. Test Feature Flags (GET /v2/todos)
  console.log('\n[3] Testing Feature Flags (GET /v2/todos)...');
  const ffRes1 = await request('GET', '/v2/todos', null, authHeaders);
  console.log('FF Disabled status:', ffRes1.status, ffRes1.body);

  // Enable FF in Redis
  console.log('Enabling FF in Redis...');
  const Redis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://default:bP0NkMPHlgzWH3Fr2LvxvvT7PyJf9vAs@redis-17668.crce181.sa-east-1-2.ec2.cloud.redislabs.com:17668';
  const redis = new Redis(redisUrl);
  await redis.set('fflag:enable-todos-v2', 'true');

  const ffRes2 = await request('GET', '/v2/todos', null, authHeaders);
  console.log('FF Enabled status:', ffRes2.status, ffRes2.body);
  await redis.del('fflag:enable-todos-v2');
  redis.disconnect();

  // 4. Test Logs endpoint
  console.log('\n[4] Testing Logs Endpoint (GET /app-logs)...');
  const logsRes = await request('GET', '/app-logs', null, {
    ...authHeaders,
    'x-api-key': 'your-admin-api-key-if-exists' // Assuming admin or api key might fail if role isn't admin
  });
  // Since we are not admin and don't know the exact API key, it might return 401. Let's see.
  console.log('Logs endpoint status:', logsRes.status);

  console.log('\n--- TESTS COMPLETED ---');
}

runTests().catch(console.error);

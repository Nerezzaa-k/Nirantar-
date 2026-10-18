const axios = require('axios');

async function testPublic() {
  const url = 'https://abu-minneapolis-therapist-practitioners.trycloudflare.com';
  console.log('Testing Public URL:', url);

  const health = await axios.get(`${url}/api/v1/health`);
  console.log('Health Check:', health.data.status, health.data.platform);

  const login = await axios.post(`${url}/api/v1/auth/login`, {
    email: 'admin@nirantar.org',
    password: 'admin123'
  });
  console.log('Public Login Success:', login.data.user.name, 'Role:', login.data.user.role);
}

testPublic().catch(err => {
  console.error('Error:', err.response ? err.response.data : err.message);
});

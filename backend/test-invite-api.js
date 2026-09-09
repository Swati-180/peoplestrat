import http from 'http';

const loginAndTest = () => {
  const options = {
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const authData = JSON.parse(data);
      const token = authData.token;
      
      console.log('Login Token:', token ? 'Success' : 'Failed');
      
      // Test 1: Invitations
      const invReq = http.request({
        hostname: '127.0.0.1',
        port: 5001,
        path: '/api/auth/invite',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (invRes) => {
        let invData = '';
        invRes.on('data', chunk => invData += chunk);
        invRes.on('end', () => {
          console.log('--- INVITATIONS ---');
          console.log('STATUS:', invRes.statusCode);
          console.log('BODY:', invData);
        });
      });
      invReq.end();

    });
  });

  req.write(JSON.stringify({ identifier: 'manager@peoplestat.com', password: 'pass1234' }));
  req.end();
};

loginAndTest();

import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const authData = JSON.parse(data);
    const token = authData.token;
    
    const getOptions = {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/employees?page=1&limit=15&search=&department=&risk=&fitmentMin=&fitmentMax=&sortBy=&sortDir=asc',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const getReq = http.request(getOptions, (getRes) => {
      let getData = '';
      getRes.on('data', chunk => getData += chunk);
      getRes.on('end', () => {
        const json = JSON.parse(getData);
        console.log('STATUS:', getRes.statusCode);
        console.log('SUCCESS:', json.success);
        console.log('COUNT:', json.data ? json.data.length : 0);
      });
    });
    getReq.end();
  });
});

req.write(JSON.stringify({ identifier: 'manager@peoplestat.com', password: 'pass1234' }));
req.end();

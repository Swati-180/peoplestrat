const http = require('http');

const body = JSON.stringify({ usernameOrEmail: 'admin_manager', password: 'password123' });

const req = http.request(
  'http://localhost:5000/api/auth/login',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  },
  (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const response = JSON.parse(data);
      if(!response.success) {
        console.error("Login failed", response);
        return;
      }
      
      const token = response.data.token;
      
      http.get('http://localhost:5000/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res2) => {
        let empData = '';
        res2.on('data', chunk => empData += chunk);
        res2.on('end', () => {
          const emps = JSON.parse(empData);
          if(!emps.success) {
             console.error("Emp fetch failed", emps);
             return;
          }
          const names = emps.data.slice(0, 5).map(e => e.userId.username);
          console.log("SEEDED USERNAMES:");
          console.log(names.join('\n'));
        });
      });
    });
  }
);

req.on('error', e => console.error(e));
req.write(body);
req.end();

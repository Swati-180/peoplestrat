
(async () => {
  try {
    const debug = await fetch('http://localhost:5001/api/debug/users');
    const dbinfo = await debug.json().catch(()=>null);
    console.log('debug users response', dbinfo);

    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'mary.johnson', password: 'password123' })
    });
    const data = await res.json();
    console.log('login response', data);
  } catch (err) {
    console.error('error', err.message);
  }
})();

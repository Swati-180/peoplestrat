// using native fetch
const server = require('./server');
const connectDB = require('./config/db');

const run = async () => {
  try {
    // ensure database is connected via config helper
    await connectDB();
    console.log('DB connection established');

    // list users in DB for debugging
    const User = require('./models/User');
    const users = await User.find().select('username email password role');
    console.log('Users present:\n', users.map(u=>({username:u.username,email:u.email,password:u.password,role:u.role})));

    // ensure server listening
    const PORT = process.env.PORT || 5000;
    console.log('Sending login request');
    const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'mary.johnson', password: 'password123' })
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error', err.message);
  } finally {
    process.exit(0);
  }
};

run();

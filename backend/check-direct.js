const mongoose = require('mongoose');
const User = require('./models/User');

const uri = process.env.CURRENT_DB_URI || process.env.DEBUG_MONGO_URI || 'mongodb://127.0.0.1:56055/';
console.log('Attempting to connect to', uri);

(async () => {
  try {
    await mongoose.connect(uri);
    const users = await User.find().lean();
    console.log('users count', users.length);
    console.log(users.map(u=>({username:u.username,email:u.email,password:u.password})).slice(0,5));
  } catch (e) {
    console.error('err', e.message);
  } finally {
    process.exit(0);
  }
})();

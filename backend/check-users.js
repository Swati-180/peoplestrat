require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');

const checkUsers = async () => {
  try {
    // Connect
    try {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ai-workforce");
      console.log('Connected to MongoDB');
    } catch (err) {
      console.log('Using In-Memory MongoDB');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
    }

    // List all users
    const users = await User.find().select('username email role');
    console.log('\n=== Users in Database ===');
    if (users.length === 0) {
      console.log('No users found!');
    } else {
      users.forEach(u => {
        console.log(`- ${u.username} (${u.email}) [${u.role}]`);
      });
    }
    console.log(`Total: ${users.length} users`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkUsers();

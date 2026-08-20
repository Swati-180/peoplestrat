require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./models/User');

const quickSeed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Try connecting to specified MongoDB
    try {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ai-workforce");
      console.log('MongoDB Connected to specified URI!');
    } catch (err) {
      // Fallback to in-memory MongoDB
      console.log('Spinning up In-Memory MongoDB for local development...');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('In-Memory MongoDB Started!');
    }

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create admin user
    const adminUser = await User.create({
      username: 'admin_manager',
      email: 'manager@aiworkforce.com',
      password: hashedPassword,
      role: 'manager'
    });
    console.log('✓ Created admin user: admin_manager / password123');

    // Create demo employees
    const demoUsers = [
      { username: 'mary.johnson', email: 'mary.johnson@example.com' },
      { username: 'john.smith', email: 'john.smith@example.com' },
      { username: 'sarah.davis', email: 'sarah.davis@example.com' },
      { username: 'michael.brown', email: 'michael.brown@example.com' },
      { username: 'emily.wilson', email: 'emily.wilson@example.com' },
    ];

    for (const userData of demoUsers) {
      await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: 'employee'
      });
    }
    console.log(`✓ Created ${demoUsers.length} demo employees`);
    console.log('\nYou can now login with:');
    console.log('Username: admin_manager or mary.johnson (or any demo user)');
    console.log('Password: password123\n');

    await mongoose.connection.close();
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err.message);
    process.exit(1);
  }
};

quickSeed();

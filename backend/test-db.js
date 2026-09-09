import mongoose from 'mongoose';
import User from './models/User.js';
import Employee from './models/Employee.js';

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:54737/');
    console.log('Connected to DB');
    const userCount = await User.countDocuments();
    const empCount = await Employee.countDocuments();
    console.log('Users:', userCount);
    console.log('Employees:', empCount);
    
    const manager = await User.findOne({ role: 'manager' });
    console.log('Manager Email:', manager ? manager.email : 'Not found');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();

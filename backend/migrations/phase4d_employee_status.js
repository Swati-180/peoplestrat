import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import Employee from '../models/Employee.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peoplestrat';

async function migrateEmployeeStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Starting phase 4D employee status migration...');

    // Find all employees that do not have a status or have an invalid one
    const result = await Employee.updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }] },
      { $set: { status: 'Active' } }
    );

    console.log(`Migration Complete: ${result.modifiedCount} employees were successfully marked as Active.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

migrateEmployeeStatus();

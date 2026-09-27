import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import 'dotenv/config';
import fs from 'fs';

const connectDB = async () => {
  try {
    // Only use MongoMemoryServer for automated tests
    if (process.env.NODE_ENV === 'test') {
      console.log('[DATABASE] Spinning up a zero-config ephemeral in-memory MongoDB for tests...');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[DATABASE] READY: Ephemeral In-Memory MongoDB Connected at ${uri}.`);
      process.env.CURRENT_DB_URI = uri;
      if (fs.existsSync('../')) {
        fs.writeFileSync('../mongo_uri.txt', uri);
      }
      return;
    }

    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('[DATABASE] FATAL: MONGO_URI environment variable is missing.');
      process.exit(1);
    }

    // Try to connect to real Mongo
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000 // fail fast if cannot connect
      });
      console.log(`[DATABASE] SUCCESS: Connected to persistent MongoDB at ${mongoURI}`);
    } catch (err) {
      console.error(`[DATABASE] FATAL: Failed to connect to persistent MongoDB at ${mongoURI}. Error: ${err.message}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('[DATABASE] FATAL: Database Initialization failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;

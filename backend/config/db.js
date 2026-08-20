import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import 'dotenv/config';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    // try to use real Mongo if URI provided
    if (mongoURI) {
      try {
        await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 5000 // fail fast if cannot connect
        });
        console.log('MongoDB Connected to provided URI...');
        return;
      } catch (err) {
        console.warn('Failed to connect to primary MongoDB URI:', err.message);
        if (process.env.NODE_ENV === 'production') {
          console.error('In production the DB connection is required. Exiting.');
          process.exit(1);
        }
        // otherwise fall through to in-memory fallback
      }
    }

    // No URI provided or connection failed -> spin up in-memory instance
    console.log('Spinning up a zero-config in-memory MongoDB for local dev...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);
    console.log(`In-Memory MongoDB Connected at ${uri}`);
    // expose URI for debugging other processes
    process.env.CURRENT_DB_URI = uri;

  } catch (err) {
    console.error('Database Initialization failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;

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
        console.log(`[DATABASE] SUCCESS: Connected to persistent MongoDB at ${mongoURI}`);
        return;
      } catch (err) {
        console.warn(`[DATABASE] WARNING: Failed to connect to persistent MongoDB at ${mongoURI}: ${err.message}`);
        if (process.env.NODE_ENV === 'production') {
          console.error('[DATABASE] FATAL: In production the DB connection is required. Exiting.');
          process.exit(1);
        }
        console.warn('[DATABASE] NOTICE: Falling back to ephemeral in-memory MongoDB because persistent DB is unavailable.');
        // otherwise fall through to in-memory fallback
      }
    }

    // No URI provided or connection failed -> spin up in-memory instance
    console.log('[DATABASE] Spinning up a zero-config ephemeral in-memory MongoDB for local dev...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);
    console.log(`[DATABASE] READY: Ephemeral In-Memory MongoDB Connected at ${uri}. NOTE: Data will be lost on restart.`);
    // expose URI for debugging other processes
    process.env.CURRENT_DB_URI = uri;

  } catch (err) {
    console.error('[DATABASE] FATAL: Database Initialization failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;

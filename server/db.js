import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri === 'memory' || !uri) {
      // Dynamically imported so this dev-only dependency is never resolved (or
      // required to be installed) in production, where MONGODB_URI is always set.
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      console.log('Starting In-Memory MongoDB Server...');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`In-memory database server running at: ${mongoUri}`);
      
      await mongoose.connect(mongoUri);
      console.log('MongoDB (In-Memory) connected successfully.');
    } else {
      console.log(`Connecting to MongoDB: ${uri}`);
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully.');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

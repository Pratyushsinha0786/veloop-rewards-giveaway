import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let mongoMemoryServerInstance: any = null;

export async function connectDB(): Promise<typeof mongoose> {
  const customUri = process.env.MONGO_URI;

  if (customUri && customUri.trim() !== '') {
    try {
      console.log('Connecting to provided MONGO_URI...');
      await mongoose.connect(customUri);
      console.log('Connected to MongoDB via MONGO_URI');
      return mongoose;
    } catch (err) {
      console.warn('Failed to connect to provided MONGO_URI, falling back to in-memory MongoDB:', err);
    }
  }

  // Fallback to MongoMemoryServer
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    if (!mongoMemoryServerInstance) {
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'veloop_rewards'
        }
      });
    }
    const inMemoryUri = mongoMemoryServerInstance.getUri();
    console.log('Starting in-memory MongoDB server...');
    await mongoose.connect(inMemoryUri);
    console.log('Connected to in-memory MongoDB instance');
    return mongoose;
  } catch (memErr) {
    console.error('Fatal error connecting to MongoDB:', memErr);
    throw memErr;
  }
}

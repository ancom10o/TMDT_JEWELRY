import mongoose from 'mongoose';
import env from './env.js';

async function connectDB() {
  try {
    const connection = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (env.nodeEnv === 'production') {
      throw error;
    }

    console.warn('Server will keep running in development mode without MongoDB.');
  }
}

export default connectDB;

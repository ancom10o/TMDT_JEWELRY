import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import env from '../config/env.js';
import Order from '../models/Order.js';

async function connectDB() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
}

export async function backfillOrderCompletedAt() {
  const orders = await Order.find({
    status: 'completed',
    $or: [
      { completedAt: { $exists: false } },
      { completedAt: null }
    ]
  }).select('_id createdAt updatedAt');

  if (orders.length === 0) {
    return 0;
  }

  const operations = orders.map((order) => ({
    updateOne: {
      filter: { _id: order._id },
      update: {
        $set: {
          completedAt: order.updatedAt || order.createdAt
        }
      }
    }
  }));

  await Order.bulkWrite(operations);
  return operations.length;
}

async function run() {
  try {
    await connectDB();
    const updatedCount = await backfillOrderCompletedAt();
    console.log(`Da cap nhat completedAt cho ${updatedCount} don hang completed cu.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Backfill completedAt error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

const currentFileUrl = pathToFileURL(process.argv[1] || '').href;

if (import.meta.url === currentFileUrl) {
  run();
}

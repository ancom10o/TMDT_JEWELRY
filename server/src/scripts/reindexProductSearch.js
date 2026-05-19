import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import env from '../config/env.js';
import Product from '../models/Product.js';
import { buildProductSearchText } from '../utils/search.js';

async function connectDB() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
}

export async function reindexProductSearch() {
  const products = await Product.find().populate('category', 'name slug');

  if (products.length === 0) {
    return 0;
  }

  const operations = products.map((product) => ({
    updateOne: {
      filter: { _id: product._id },
      update: {
        $set: {
          searchText: buildProductSearchText(product, product.category)
        }
      }
    }
  }));

  await Product.bulkWrite(operations);
  return products.length;
}

async function run() {
  try {
    await connectDB();
    const updatedCount = await reindexProductSearch();
    console.log(`Da cap nhat searchText cho ${updatedCount} san pham.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Reindex search error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

const currentFileUrl = pathToFileURL(process.argv[1] || '').href;

if (import.meta.url === currentFileUrl) {
  run();
}

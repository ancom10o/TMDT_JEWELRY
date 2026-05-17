import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import env from '../config/env.js';
import Cart from '../models/Cart.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Banner from '../models/Banner.js';
import HomeSection from '../models/HomeSection.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import {
  adminUser,
  buildProducts,
  categories,
  coupons,
  homepageBanners,
  homepageSections,
  sampleUsers
} from './data.js';

async function connectSeedDB() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
}

async function importData() {
  await Review.deleteMany();
  await Order.deleteMany();
  await Cart.deleteMany();
  await Coupon.deleteMany();
  await HomeSection.deleteMany();
  await Banner.deleteMany();
  await Product.deleteMany();
  await Category.deleteMany();
  await User.deleteOne({ email: adminUser.email });
  await User.deleteMany({ email: { $in: sampleUsers.map((user) => user.email) } });

  const createdAdmin = await User.create(adminUser);
  await User.insertMany(sampleUsers);
  const createdCategories = await Category.insertMany(categories);

  const categoryMap = createdCategories.reduce((result, category) => {
    result[category.slug] = category._id;
    return result;
  }, {});

  const sampleProducts = buildProducts(categoryMap);
  const createdProducts = await Product.insertMany(sampleProducts);
  await Coupon.insertMany(
    coupons.map((coupon) => ({
      ...coupon,
      createdBy: createdAdmin._id
    }))
  );
  const createdBanners = await Banner.insertMany(homepageBanners);

  const featuredProducts = createdProducts.filter((product) => product.isFeatured).slice(0, 8);
  const latestProducts = [...createdProducts].slice(-8).reverse();
  const bannerIds = createdBanners.map((banner) => banner._id);

  await HomeSection.insertMany(
    homepageSections.map((section) => ({
      ...section,
      banners: section.key === 'hero-banner' ? bannerIds : [],
      bannerIds: section.key === 'hero-banner' ? bannerIds : [],
      products:
        section.key === 'favorite-products'
          ? featuredProducts.map((product) => product._id)
          : section.key === 'new-arrivals'
            ? latestProducts.map((product) => product._id)
            : [],
      productIds:
        section.key === 'favorite-products'
          ? featuredProducts.map((product) => product._id)
          : section.key === 'new-arrivals'
            ? latestProducts.map((product) => product._id)
            : []
    }))
  );

  console.log('Seed import thanh cong.');
  console.log(`Admin: ${createdAdmin.email} / ${adminUser.password}`);
  console.log(`Danh muc: ${createdCategories.length}`);
  console.log(`San pham: ${sampleProducts.length}`);
  console.log(`Ma giam gia: ${coupons.length}`);
  console.log(`Banner homepage: ${createdBanners.length}`);
  console.log(`Section homepage: ${homepageSections.length}`);
}

async function destroyData() {
  await Review.deleteMany();
  await Order.deleteMany();
  await Cart.deleteMany();
  await Coupon.deleteMany();
  await HomeSection.deleteMany();
  await Banner.deleteMany();
  await Product.deleteMany();
  await Category.deleteMany();
  await User.deleteOne({ email: adminUser.email });
  await User.deleteMany({ email: { $in: sampleUsers.map((user) => user.email) } });

  console.log('Da xoa du lieu mau.');
}

async function runSeeder() {
  try {
    await connectSeedDB();

    if (process.argv[2] === '--destroy') {
      await destroyData();
    } else {
      await importData();
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

const currentFileUrl = pathToFileURL(process.argv[1] || '').href;

if (import.meta.url === currentFileUrl) {
  runSeeder();
}

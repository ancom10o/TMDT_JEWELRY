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
import { buildProductSearchText } from '../utils/search.js';
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

function buildOrderItem(product, quantity) {
  return {
    product: product._id,
    name: product.name,
    productName: product.name,
    sku: product.sku,
    image: product.images?.[0] || '',
    quantity,
    costPrice: product.costPrice || 0,
    price: product.price,
    selectedSize: product.size?.[0] || ''
  };
}

function buildSampleOrders({ users, products }) {
  const monthlyPlan = [
    { month: 1, days: [4, 9, 16, 23], orderCounts: [2, 1, 2, 1] },
    { month: 2, days: [3, 8, 14, 20, 27], orderCounts: [1, 2, 2, 1, 2] },
    { month: 3, days: [2, 7, 12, 18, 24, 29], orderCounts: [2, 2, 3, 1, 2, 2] },
    { month: 4, days: [5, 10, 15, 21, 26], orderCounts: [2, 3, 2, 2, 3] },
    { month: 5, days: [1, 6, 11, 17, 22, 28], orderCounts: [3, 2, 3, 2, 3, 2] }
  ];

  const paymentMethods = ['cod', 'bank_transfer'];
  let orderIndex = 0;

  return monthlyPlan.flatMap((monthPlan) =>
    monthPlan.days.flatMap((day, dayIndex) =>
      Array.from({ length: monthPlan.orderCounts[dayIndex] }, (_, countIndex) => {
        const firstProduct = products[(orderIndex * 2 + countIndex) % products.length];
        const secondProduct = products[(orderIndex * 3 + dayIndex + 5) % products.length];
        const items = [
          buildOrderItem(firstProduct, (orderIndex % 2) + 1),
          buildOrderItem(secondProduct, 1)
        ];
        const totalBeforeDiscount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const hasCoupon = orderIndex % 4 === 0;
        const discountAmount = hasCoupon ? Math.min(Math.round(totalBeforeDiscount * 0.08), 300000) : 0;
        const createdAt = new Date(Date.UTC(2026, monthPlan.month - 1, day, 2 + (countIndex % 6), 30, 0));
        const user = users[orderIndex % users.length];

        orderIndex += 1;

        return {
          user: user._id,
          items,
          shippingAddress: {
            fullName: user.fullName,
            phone: user.phone,
            addressLine: user.address || 'Quan 1',
            ward: 'Phuong Ben Nghe',
            district: 'Quan 1',
            city: 'TP. Ho Chi Minh',
            note: 'Don hang mau cho dashboard'
          },
          paymentMethod: paymentMethods[orderIndex % paymentMethods.length],
          couponCode: hasCoupon ? 'WELCOME10' : '',
          discountAmount,
          totalBeforeDiscount,
          totalPrice: totalBeforeDiscount - discountAmount,
          status: 'completed',
          isPaid: true,
          paidAt: createdAt,
          createdAt,
          updatedAt: createdAt
        };
      })
    )
  );
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
  const createdUsers = await User.insertMany(sampleUsers);
  const createdCategories = await Category.insertMany(categories);

  const categoryMap = createdCategories.reduce((result, category) => {
    result[category.slug] = category._id;
    return result;
  }, {});
  const categoryInfoMap = createdCategories.reduce((result, category) => {
    result[category._id.toString()] = category;
    return result;
  }, {});

  const sampleProducts = buildProducts(categoryMap).map((product) => {
    const category = categoryInfoMap[product.category.toString()];
    return {
      ...product,
      searchText: buildProductSearchText(product, category)
    };
  });
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

  const sampleOrders = buildSampleOrders({
    users: createdUsers,
    products: createdProducts
  });
  await Order.insertMany(sampleOrders);

  console.log('Seed import thanh cong.');
  console.log(`Admin: ${createdAdmin.email} / ${adminUser.password}`);
  console.log(`Danh muc: ${createdCategories.length}`);
  console.log(`San pham: ${sampleProducts.length}`);
  console.log(`Ma giam gia: ${coupons.length}`);
  console.log(`Don hang mau: ${sampleOrders.length}`);
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

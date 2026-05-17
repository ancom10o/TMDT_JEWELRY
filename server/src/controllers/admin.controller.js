import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [totalProducts, totalOrders, totalUsers, activeCoupons, revenueResult, recentOrders, lowStockProducts] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Coupon.countDocuments({ isActive: true, endDate: { $gte: new Date() } }),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ]),
        Order.find()
          .populate('user', 'fullName email')
          .sort({ createdAt: -1 })
          .limit(5),
        Product.find({ stock: { $lte: 10 }, status: 'active' })
          .populate('category', 'name slug')
          .sort({ stock: 1, createdAt: -1 })
          .limit(8)
      ]);

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        revenue: revenueResult[0]?.totalRevenue || 0,
        activeCoupons
      },
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    next(error);
  }
}

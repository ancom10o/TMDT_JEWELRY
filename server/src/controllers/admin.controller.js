import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { createWorkbookBuffer } from '../utils/excel.js';

function startOfMonth(year, month) {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

function startOfNextMonth(year, month) {
  return month === 12 ? startOfMonth(year + 1, 1) : startOfMonth(year, month + 1);
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function sendWorkbook(res, filename, buffer) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function getDashboardStats(req, res, next) {
  try {
    const now = new Date();
    const chartYear = Number(req.query.year) || now.getFullYear();
    const yearStart = new Date(chartYear, 0, 1);
    const nextYearStart = new Date(chartYear + 1, 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      activeCoupons,
      revenueResult,
      revenueByMonthResult,
      revenueByDayResult,
      monthlyOrders,
      recentOrders,
      lowStockProducts
    ] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Coupon.countDocuments({ isActive: true, endDate: { $gte: new Date() } }),
        Order.aggregate([
          {
            $match: {
              status: { $in: ['completed', 'delivered'] },
              createdAt: { $gte: monthStart, $lt: nextMonthStart }
            }
          },
          { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ]),
        Order.aggregate([
          {
            $match: {
              status: { $in: ['completed', 'delivered'] },
              createdAt: { $gte: yearStart, $lt: nextYearStart }
            }
          },
          {
            $group: {
              _id: { $month: '$createdAt' },
              revenue: { $sum: '$totalPrice' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Order.aggregate([
          {
            $match: {
              status: { $in: ['completed', 'delivered'] },
              createdAt: { $gte: yearStart, $lt: nextYearStart }
            }
          },
          {
            $group: {
              _id: {
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              revenue: { $sum: '$totalPrice' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { '_id.month': 1, '_id.day': 1 } }
        ]),
        Order.countDocuments({
          createdAt: { $gte: monthStart, $lt: nextMonthStart }
        }),
        Order.find()
          .populate('user', 'fullName email')
          .sort({ createdAt: -1 })
          .limit(5),
        Product.find({ stock: { $lte: 10 }, status: 'active' })
          .populate('category', 'name slug')
          .sort({ stock: 1, createdAt: -1 })
          .limit(8)
      ]);

    const revenueByMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const matchedMonth = revenueByMonthResult.find((item) => item._id === month);
      return {
        month,
        revenue: matchedMonth?.revenue || 0,
        orders: matchedMonth?.orders || 0
      };
    });

    const revenueByDay = Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const daysInMonth = getDaysInMonth(chartYear, month);
      return {
        month,
        days: Array.from({ length: daysInMonth }, (_, dayIndex) => {
          const day = dayIndex + 1;
          const matchedDay = revenueByDayResult.find((item) => item._id.month === month && item._id.day === day);
          return {
            day,
            revenue: matchedDay?.revenue || 0,
            orders: matchedDay?.orders || 0
          };
        })
      };
    });

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        monthlyRevenue: revenueResult[0]?.totalRevenue || 0,
        revenue: revenueResult[0]?.totalRevenue || 0,
        monthlyOrders,
        activeCoupons
      },
      revenueByMonth,
      revenueByDay,
      chartYear,
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    next(error);
  }
}

export async function exportProductsExcel(req, res, next) {
  try {
    const products = await Product.find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const columns = [
      { key: 'sku', header: 'SKU' },
      { key: 'name', header: 'Ten san pham' },
      { key: 'category', header: 'Danh muc' },
      { key: 'gender', header: 'Gioi tinh' },
      { key: 'materialGroup', header: 'Nhom chat lieu' },
      { key: 'materialDetail', header: 'Chi tiet chat lieu' },
      { key: 'costPrice', header: 'Gia nhap' },
      { key: 'price', header: 'Gia ban' },
      { key: 'stock', header: 'Ton kho' }
    ];

    const rows = products.map((product) => ({
      sku: product.sku || '',
      name: product.name || '',
      category: product.category?.name || '',
      gender: product.gender || '',
      materialGroup: product.materialGroup || '',
      materialDetail: product.materialDetail || product.material || '',
      costPrice: product.costPrice || 0,
      price: product.price || 0,
      stock: product.stock || 0
    }));

    const buffer = createWorkbookBuffer({ columns, rows, sheetName: 'Products' });
    sendWorkbook(res, 'products-export.xlsx', buffer);
  } catch (error) {
    next(error);
  }
}

export async function exportMonthlyRevenueExcel(req, res, next) {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const fromDateQuery = req.query.fromDate;
    const toDateQuery = req.query.toDate;
    const hasDateRange = Boolean(fromDateQuery || toDateQuery);

    if (!hasDateRange && (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)) {
      return res.status(400).json({ message: 'Thang hoac nam khong hop le.' });
    }

    const fromDate = hasDateRange ? startOfDay(fromDateQuery) : startOfMonth(year, month);
    const toDate = hasDateRange ? endOfDay(toDateQuery || fromDateQuery) : startOfNextMonth(year, month);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
      return res.status(400).json({ message: 'Khoang ngay export khong hop le.' });
    }

    const orders = await Order.find({
      status: { $in: ['completed', 'delivered'] },
      createdAt: { $gte: fromDate, $lt: toDate }
    })
      .populate('user', 'fullName email phone')
      .sort({ createdAt: -1 })
      .lean();

    const columns = [
      { key: 'orderCode', header: 'Ma don hang' },
      { key: 'orderDate', header: 'Ngay dat' },
      { key: 'status', header: 'Trang thai' },
      { key: 'paymentMethod', header: 'Phuong thuc thanh toan' },
      { key: 'customerName', header: 'Ten khach hang' },
      { key: 'phone', header: 'SDT' },
      { key: 'sku', header: 'SKU' },
      { key: 'quantity', header: 'So luong' },
      { key: 'costPrice', header: 'Gia nhap' },
      { key: 'price', header: 'Gia ban' },
      { key: 'lineTotal', header: 'Thanh tien' },
      { key: 'couponCode', header: 'Ma giam gia' },
      { key: 'discountAmount', header: 'So tien giam' },
      { key: 'netReceived', header: 'Thuc nhan' }
    ];

    const rows = orders.flatMap((order) =>
      order.items.map((item) => ({
        orderCode: `#${order.orderCode || order._id.toString().slice(-6).toUpperCase()}`,
        orderDate: new Intl.DateTimeFormat('vi-VN').format(new Date(order.createdAt)),
        status: order.status,
        paymentMethod: order.paymentMethod,
        customerName: order.user?.fullName || order.shippingAddress?.fullName || '',
        phone: order.shippingAddress?.phone || order.user?.phone || '',
        sku: item.sku || '',
        quantity: item.quantity || 0,
        costPrice: item.costPrice || 0,
        price: item.price || 0,
        lineTotal: (item.price || 0) * (item.quantity || 0),
        couponCode: order.couponCode || '',
        discountAmount: order.discountAmount || 0,
        netReceived: order.totalPrice || 0
      }))
    );

    const filename = hasDateRange
      ? `revenue-${fromDateQuery}-to-${toDateQuery || fromDateQuery}.xlsx`
      : `revenue-${year}-${String(month).padStart(2, '0')}.xlsx`;
    const buffer = createWorkbookBuffer({ columns, rows, sheetName: `Revenue ${year}-${month}` });
    sendWorkbook(res, filename, buffer);
  } catch (error) {
    next(error);
  }
}

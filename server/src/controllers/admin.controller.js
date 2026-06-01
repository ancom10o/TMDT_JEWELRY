import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { createWorkbookBuffer } from '../utils/excel.js';

const COMPLETED_ORDER_STATUS = 'completed';
const REPORT_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const REPORT_TIME_ZONE_OFFSET_MS = 7 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 10;
const PROCESSING_ORDER_STATUSES = ['pending', 'processing', 'confirmed'];

function startOfMonth(year, month) {
  return startOfVietnamDayUtc(year, month, 1);
}

function startOfNextMonth(year, month) {
  return month === 12 ? startOfMonth(year + 1, 1) : startOfMonth(year, month + 1);
}

function getVietnamDateParts(value = new Date()) {
  const vietnamDate = new Date(value.getTime() + REPORT_TIME_ZONE_OFFSET_MS);

  return {
    year: vietnamDate.getUTCFullYear(),
    month: vietnamDate.getUTCMonth() + 1,
    day: vietnamDate.getUTCDate()
  };
}

function startOfVietnamDayUtc(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day) - REPORT_TIME_ZONE_OFFSET_MS);
}

function parseDateInput(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function startOfDay(value) {
  const parsedDate = parseDateInput(value);

  if (!parsedDate) {
    return new Date(Number.NaN);
  }

  return startOfVietnamDayUtc(parsedDate.year, parsedDate.month, parsedDate.day);
}

function startOfNextDay(value) {
  const parsedDate = parseDateInput(value);

  if (!parsedDate) {
    return new Date(Number.NaN);
  }

  return startOfVietnamDayUtc(parsedDate.year, parsedDate.month, parsedDate.day + 1);
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function sendWorkbook(res, filename, buffer) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

function buildValidRevenueMatch(dateRange = {}) {
  return {
    status: COMPLETED_ORDER_STATUS,
    ...dateRange,
    $or: [
      { paymentMethod: 'bank_transfer', paymentStatus: 'paid' },
      { paymentMethod: 'cod' }
    ]
  };
}

export async function getDashboardStats(req, res, next) {
  try {
    const now = new Date();
    const currentVietnamDate = getVietnamDateParts(now);
    const chartYear = Number(req.query.year) || currentVietnamDate.year;
    const yearStart = startOfMonth(chartYear, 1);
    const nextYearStart = startOfMonth(chartYear + 1, 1);
    const monthStart = startOfMonth(currentVietnamDate.year, currentVietnamDate.month);
    const nextMonthStart = startOfNextMonth(currentVietnamDate.year, currentVietnamDate.month);

    const [
      totalProducts,
      revenueResult,
      revenueByMonthResult,
      revenueByDayResult,
      monthlyOrders,
      pendingOrders,
      monthlyCompletedOrders,
      lowStockProductsCount,
      recentOrders,
      pendingBankTransferOrders,
      lowStockProducts
    ] =
      await Promise.all([
        Product.countDocuments(),
        Order.aggregate([
          {
            $match: buildValidRevenueMatch({
              completedAt: { $gte: monthStart, $lt: nextMonthStart }
            })
          },
          { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ]),
        Order.aggregate([
          {
            $match: buildValidRevenueMatch({
              completedAt: { $gte: yearStart, $lt: nextYearStart }
            })
          },
          {
            $group: {
              _id: { $month: { date: '$completedAt', timezone: REPORT_TIME_ZONE } },
              revenue: { $sum: '$totalPrice' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Order.aggregate([
          {
            $match: buildValidRevenueMatch({
              completedAt: { $gte: yearStart, $lt: nextYearStart }
            })
          },
          {
            $group: {
              _id: {
                month: { $month: { date: '$completedAt', timezone: REPORT_TIME_ZONE } },
                day: { $dayOfMonth: { date: '$completedAt', timezone: REPORT_TIME_ZONE } }
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
        Order.countDocuments({
          status: { $in: PROCESSING_ORDER_STATUSES }
        }),
        Order.countDocuments({
          status: COMPLETED_ORDER_STATUS,
          completedAt: { $gte: monthStart, $lt: nextMonthStart }
        }),
        Product.countDocuments({ stock: { $lte: LOW_STOCK_THRESHOLD }, status: 'active' }),
        Order.find()
          .populate('user', 'fullName email')
          .sort({ createdAt: -1 })
          .limit(5),
        Order.find({
          paymentMethod: 'bank_transfer',
          paymentStatus: 'pending',
          status: { $ne: 'cancelled' }
        })
          .populate('user', 'fullName email')
          .sort({ createdAt: -1 })
          .limit(5),
        Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD }, status: 'active' })
          .populate('category', 'name slug')
          .sort({ stock: 1, createdAt: -1 })
          .limit(5)
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
        monthlyRevenue: revenueResult[0]?.totalRevenue || 0,
        revenue: revenueResult[0]?.totalRevenue || 0,
        monthlyOrders,
        pendingOrders,
        monthlyCompletedOrders,
        lowStockProductsCount,
        lowStockThreshold: LOW_STOCK_THRESHOLD
      },
      revenueByMonth,
      revenueByDay,
      chartYear,
      recentOrders,
      pendingBankTransferOrders,
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
    const toDate = hasDateRange ? startOfNextDay(toDateQuery || fromDateQuery) : startOfNextMonth(year, month);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate >= toDate) {
      return res.status(400).json({ message: 'Khoang ngay export khong hop le.' });
    }

    const orders = await Order.find({
      status: COMPLETED_ORDER_STATUS,
      completedAt: { $gte: fromDate, $lt: toDate }
    })
      .populate('user', 'fullName email phone')
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();

    const columns = [
      { key: 'orderCode', header: 'Ma don hang' },
      { key: 'orderDate', header: 'Ngay dat' },
      { key: 'completedDate', header: 'Ngay hoan thanh' },
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
        orderDate: new Intl.DateTimeFormat('vi-VN', { timeZone: REPORT_TIME_ZONE }).format(new Date(order.createdAt)),
        completedDate: new Intl.DateTimeFormat('vi-VN', { timeZone: REPORT_TIME_ZONE }).format(new Date(order.completedAt)),
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

import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { buildBankQrUrlFromInfo, generateOrderCode } from '../utils/bankTransfer.js';
import { getSiteSettingsDocument } from './siteSetting.controller.js';
import { normalizeCouponCode, validateCouponForOrder } from '../utils/coupon.js';

const ALLOWED_PAYMENT_METHODS = ['cod', 'bank_transfer'];
const FREE_SHIPPING_MIN_TOTAL = 1000000;
const STANDARD_SHIPPING_FEE = 30000;

function calculateShippingFee(totalBeforeDiscount, freeShippingThreshold = FREE_SHIPPING_MIN_TOTAL) {
  const safeTotal = Math.max(Number(totalBeforeDiscount) || 0, 0);
  const safeThreshold = Math.max(Number(freeShippingThreshold) || FREE_SHIPPING_MIN_TOTAL, 0);
  return safeThreshold > 0 && safeTotal >= safeThreshold ? 0 : STANDARD_SHIPPING_FEE;
}

function normalizeVietnamPhone(value = '') {
  return String(value).replace(/[^\d+]/g, '');
}

function isValidVietnamPhone(value) {
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalizeVietnamPhone(value));
}

function normalizeShippingAddress(payload = {}) {
  return {
    fullName: payload.fullName?.trim() || '',
    phone: normalizeVietnamPhone(payload.phone),
    city: payload.city?.trim() || '',
    ward: payload.ward?.trim() || '',
    district: payload.district?.trim() || '',
    addressLine: payload.addressLine?.trim() || '',
    note: payload.note?.trim() || ''
  };
}

function validateShippingAddress(address) {
  if (!address.fullName || !address.phone || !address.city || !address.district || !address.ward || !address.addressLine) {
    return 'Vui long nhap day du thong tin giao hang.';
  }

  if (address.fullName.length < 2) {
    return 'Ho ten nguoi nhan phai co it nhat 2 ky tu.';
  }

  if (!isValidVietnamPhone(address.phone)) {
    return 'So dien thoai nguoi nhan khong hop le.';
  }

  return null;
}

function normalizeGuestItems(payload = []) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => ({
      productId: item.productId?.toString().trim() || '',
      quantity: Math.max(Number(item.quantity) || 1, 1),
      selectedSize: item.selectedSize?.trim() || ''
    }))
    .filter((item) => item.productId);
}

function buildOrderItemsFromCart(cartItems, productMap) {
  return cartItems.map((item) => {
    const productId = item.product._id?.toString() || item.product.toString();
    const product = productMap.get(productId);

    return {
      product: product._id,
      name: product.name,
      productName: product.name,
      sku: product.sku,
      image: product.images?.[0] || '',
      quantity: item.quantity,
      costPrice: product.costPrice || 0,
      price: product.price,
      selectedSize: item.selectedSize || ''
    };
  });
}

function buildOrderItemsFromRequest(requestItems, productMap) {
  return requestItems.map((item) => {
    const product = productMap.get(item.productId);

    return {
      product: product._id,
      name: product.name,
      productName: product.name,
      sku: product.sku,
      image: product.images?.[0] || '',
      quantity: item.quantity,
      costPrice: product.costPrice || 0,
      price: product.price,
      selectedSize: item.selectedSize || ''
    };
  });
}

async function buildOrderDraft({ req, session, couponCode }) {
  const isAuthenticated = Boolean(req.user?._id);

  if (isAuthenticated) {
    const requestItems = normalizeGuestItems(req.body.items);
    const requestedItemKeys = new Set(requestItems.map((item) => `${item.productId}:${item.selectedSize || ''}`));
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug images price costPrice sku stock sold status')
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error('Không có sản phẩm để tạo đơn hàng.');
    }

    const cartItemsForOrder = requestItems.length > 0
      ? cart.items.filter((item) => requestedItemKeys.has(`${item.product._id.toString()}:${item.selectedSize || ''}`))
      : cart.items;

    if (cartItemsForOrder.length === 0 && requestItems.length > 0) {
      const productIds = requestItems.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map((product) => [product._id.toString(), product]));

      for (const item of requestItems) {
        const product = productMap.get(item.productId);

        if (!product || product.status !== 'active') {
          throw new Error('Có sản phẩm không còn khả dụng để đặt hàng.');
        }

        if (product.stock < item.quantity) {
          throw new Error(`Sản phẩm ${product.name} không đủ tồn kho.`);
        }
      }

      return {
        cart: null,
        productMap,
        validatedItems: buildOrderItemsFromRequest(requestItems, productMap),
        userId: req.user._id,
        couponCode
      };
    }

    if (cartItemsForOrder.length === 0) {
      throw new Error('Vui lòng chọn sản phẩm cần thanh toán.');
    }

    const productIds = cartItemsForOrder.map((item) => item.product._id);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    for (const item of cartItemsForOrder) {
      const productId = item.product._id.toString();
      const product = productMap.get(productId);

      if (!product || product.status !== 'active') {
        throw new Error('Có sản phẩm không còn khả dụng để đặt hàng.');
      }

      if (product.stock < item.quantity) {
        throw new Error(`Sản phẩm ${product.name} không đủ tồn kho.`);
      }
    }

    return {
      cart,
      cartItemsForOrder,
      productMap,
      validatedItems: buildOrderItemsFromCart(cartItemsForOrder, productMap),
      userId: req.user._id,
      couponCode
    };
  }

  const requestItems = normalizeGuestItems(req.body.items);

  if (requestItems.length === 0) {
    throw new Error('Không có sản phẩm để tạo đơn hàng.');
  }

  const productIds = requestItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).session(session);
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  for (const item of requestItems) {
    const product = productMap.get(item.productId);

    if (!product || product.status !== 'active') {
      throw new Error('Có sản phẩm không còn khả dụng để đặt hàng.');
    }

    if (product.stock < item.quantity) {
      throw new Error(`Sản phẩm ${product.name} không đủ tồn kho.`);
    }
  }

  return {
    cart: null,
    productMap,
    validatedItems: buildOrderItemsFromRequest(requestItems, productMap),
    userId: null,
    couponCode
  };
}

export async function getOrders(req, res, next) {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const orders = await Order.find(filter)
      .populate('user', 'fullName email')
      .populate('items.product', 'name slug')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name slug')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phone address')
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    if (!order.user) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
      }
    } else if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const shippingAddress = normalizeShippingAddress(req.body.shippingAddress);
    const paymentMethod = (req.body.paymentMethod || 'cod').trim().toLowerCase();
    const couponCode = normalizeCouponCode(req.body.couponCode);

    const shippingError = validateShippingAddress(shippingAddress);
    if (shippingError) {
      res.status(400);
      throw new Error(shippingError);
    }

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      res.status(400);
      throw new Error('Phương thức thanh toán không hợp lệ.');
    }

    let createdOrderId = null;

    await session.withTransaction(async () => {
      const draft = await buildOrderDraft({ req, session, couponCode });
      const totalBeforeDiscount = draft.validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const couponResult = await validateCouponForOrder({
        code: draft.couponCode,
        orderTotal: totalBeforeDiscount,
        session,
        incrementUsage: Boolean(draft.couponCode)
      });

      if (couponResult.errorMessage) {
        throw new Error(couponResult.errorMessage);
      }
      const siteSettings = await getSiteSettingsDocument();
      const shippingFee = calculateShippingFee(totalBeforeDiscount, siteSettings.freeShippingThreshold);
      const finalTotal = couponResult.finalTotal + shippingFee;

      for (const item of draft.validatedItems) {
        const product = draft.productMap.get(item.product.toString());
        product.stock -= item.quantity;
        product.sold += item.quantity;
        await product.save({ session });
      }

      const orderCode = await generateOrderCode({ session });
      const isBankTransfer = paymentMethod === 'bank_transfer';
      const bankTransferInfo = isBankTransfer
        ? {
            bankCode: siteSettings.bankCode || '',
            bankName: siteSettings.bankName || '',
            bankAccount: siteSettings.bankAccountNumber || '',
            accountName: siteSettings.bankAccountName || ''
          }
        : {};
      const bankTransferQrUrl = isBankTransfer
        ? buildBankQrUrlFromInfo({ amount: finalTotal, orderCode, ...bankTransferInfo })
        : '';

      const [createdOrder] = await Order.create(
        [
          {
            user: draft.userId,
            items: draft.validatedItems,
            shippingAddress,
            orderCode,
            paymentMethod,
            paymentStatus: isBankTransfer ? 'pending' : 'unpaid',
            bankTransferContent: isBankTransfer ? orderCode : '',
            bankTransferBankCode: bankTransferInfo.bankCode || '',
            bankTransferBankName: bankTransferInfo.bankName || '',
            bankTransferAccountNumber: bankTransferInfo.bankAccount || '',
            bankTransferAccountName: bankTransferInfo.accountName || '',
            bankTransferQrUrl,
            couponCode: couponResult.couponCode,
            discountAmount: couponResult.discountAmount,
            totalBeforeDiscount,
            shippingFee,
            totalPrice: finalTotal
          }
        ],
        { session }
      );

      createdOrderId = createdOrder._id;

      if (draft.cart) {
        const orderedItemKeys = new Set(
          draft.cartItemsForOrder.map((item) => `${item.product._id.toString()}:${item.selectedSize || ''}`)
        );
        draft.cart.items = draft.cart.items.filter(
          (item) => !orderedItemKeys.has(`${item.product._id.toString()}:${item.selectedSize || ''}`)
        );
        await draft.cart.save({ session });
      }
    });

    const order = await Order.findById(createdOrderId)
      .populate('user', 'fullName email phone address')
      .populate('items.product', 'name slug images');

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

export async function cancelMyOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name slug images')
      .populate('user', 'fullName email');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    if (!order.user || order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này.' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Đơn hàng này không thể hủy ở trạng thái hiện tại.' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    if (typeof req.body.status !== 'undefined') {
      const nextStatus = req.body.status === 'delivered' ? 'completed' : req.body.status;
      const allowedTransitions = {
        pending: order.paymentMethod === 'cod' ? ['confirmed'] : [],
        confirmed: ['shipping'],
        shipping: ['completed'],
        completed: [],
        cancelled: []
      };

      if (!allowedTransitions[order.status]?.includes(nextStatus)) {
        return res.status(400).json({ message: 'Trang thai don hang khong dung quy trinh xu ly.' });
      }

      if (nextStatus === 'confirmed' && order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid') {
        return res.status(400).json({ message: 'Don chuyen khoan can xac nhan thanh toan truoc.' });
      }

      order.status = nextStatus;

      if (nextStatus === 'completed' && !order.completedAt) {
        order.completedAt = new Date();
      }

      if (nextStatus !== 'completed') {
        order.completedAt = null;
      }
    }

    if (typeof req.body.isPaid !== 'undefined') {
      if (order.paymentMethod === 'bank_transfer' && req.body.isPaid && order.status !== 'pending') {
        return res.status(400).json({ message: 'Chi xac nhan thanh toan chuyen khoan khi don dang cho xac nhan.' });
      }

      order.isPaid = req.body.isPaid;
      order.paidAt = req.body.isPaid ? new Date() : null;
      order.paymentStatus = req.body.isPaid ? 'paid' : order.paymentMethod === 'bank_transfer' ? 'pending' : 'unpaid';
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'fullName email')
      .populate('items.product', 'name slug');

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  }
}

export async function confirmBankTransferPayment(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    if (order.paymentMethod !== 'bank_transfer') {
      return res.status(400).json({ message: 'Đơn hàng này không dùng phương thức chuyển khoản.' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Chi xac nhan thanh toan khi don dang cho xac nhan.' });
    }

    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();

    if (order.status === 'pending') {
      order.status = 'confirmed';
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'fullName email')
      .populate('items.product', 'name slug');

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  }
}

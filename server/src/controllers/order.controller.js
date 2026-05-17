import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { normalizeCouponCode, validateCouponForOrder } from '../utils/coupon.js';

const ALLOWED_PAYMENT_METHODS = ['cod', 'bank_transfer'];

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
      image: product.images?.[0] || '',
      quantity: item.quantity,
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
      image: product.images?.[0] || '',
      quantity: item.quantity,
      price: product.price,
      selectedSize: item.selectedSize || ''
    };
  });
}

async function buildOrderDraft({ req, session, couponCode }) {
  const isAuthenticated = Boolean(req.user?._id);

  if (isAuthenticated) {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name slug images price stock sold status')
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error('Khong co san pham de tao don hang.');
    }

    const productIds = cart.items.map((item) => item.product._id);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    for (const item of cart.items) {
      const productId = item.product._id.toString();
      const product = productMap.get(productId);

      if (!product || product.status !== 'active') {
        throw new Error('Co san pham khong con kha dung de dat hang.');
      }

      if (product.stock < item.quantity) {
        throw new Error(`San pham ${product.name} khong du ton kho.`);
      }
    }

    return {
      cart,
      productMap,
      validatedItems: buildOrderItemsFromCart(cart.items, productMap),
      userId: req.user._id,
      couponCode
    };
  }

  const requestItems = normalizeGuestItems(req.body.items);

  if (requestItems.length === 0) {
    throw new Error('Khong co san pham de tao don hang.');
  }

  const productIds = requestItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).session(session);
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  for (const item of requestItems) {
    const product = productMap.get(item.productId);

    if (!product || product.status !== 'active') {
      throw new Error('Co san pham khong con kha dung de dat hang.');
    }

    if (product.stock < item.quantity) {
      throw new Error(`San pham ${product.name} khong du ton kho.`);
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
      return res.status(404).json({ message: 'Khong tim thay don hang.' });
    }

    if (!order.user) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Ban khong co quyen xem don hang nay.' });
      }
    } else if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Ban khong co quyen xem don hang nay.' });
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
      throw new Error('Phuong thuc thanh toan khong hop le.');
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

      for (const item of draft.validatedItems) {
        const product = draft.productMap.get(item.product.toString());
        product.stock -= item.quantity;
        product.sold += item.quantity;
        await product.save({ session });
      }

      const [createdOrder] = await Order.create(
        [
          {
            user: draft.userId,
            items: draft.validatedItems,
            shippingAddress,
            paymentMethod,
            couponCode: couponResult.couponCode,
            discountAmount: couponResult.discountAmount,
            totalBeforeDiscount,
            totalPrice: couponResult.finalTotal
          }
        ],
        { session }
      );

      createdOrderId = createdOrder._id;

      if (draft.cart) {
        draft.cart.items = [];
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
      return res.status(404).json({ message: 'Khong tim thay don hang.' });
    }

    if (!order.user || order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Ban khong co quyen huy don hang nay.' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Don hang nay khong the huy o trang thai hien tai.' });
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
    const updateData = {};

    if (typeof req.body.status !== 'undefined') {
      updateData.status = req.body.status === 'delivered' ? 'completed' : req.body.status;
    }

    if (typeof req.body.isPaid !== 'undefined') {
      updateData.isPaid = req.body.isPaid;
      updateData.paidAt = req.body.isPaid ? new Date() : null;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('user', 'fullName email')
      .populate('items.product', 'name slug');

    if (!order) {
      return res.status(404).json({ message: 'Khong tim thay don hang.' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

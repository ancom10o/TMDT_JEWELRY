import Coupon from '../models/Coupon.js';
import { normalizeCouponCode, validateCouponForOrder } from '../utils/coupon.js';

function parseNumber(value, fallback = 0) {
  if (value === '' || value === null || typeof value === 'undefined') {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

function normalizeCouponPayload(payload = {}) {
  return {
    code: normalizeCouponCode(payload.code),
    name: payload.name?.trim() || '',
    description: payload.description?.trim() || '',
    discountType: payload.discountType,
    discountValue: parseNumber(payload.discountValue),
    minOrderValue: parseNumber(payload.minOrderValue, 0),
    maxDiscountAmount: parseNumber(payload.maxDiscountAmount, 0),
    usageLimit: parseNumber(payload.usageLimit, 0),
    startDate: payload.startDate ? new Date(payload.startDate) : null,
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    isActive: Boolean(payload.isActive)
  };
}

function validateCouponPayload(payload) {
  if (!payload.code) {
    return 'Vui long nhap ma giam gia.';
  }

  if (!payload.name) {
    return 'Vui long nhap ten ma giam gia.';
  }

  if (!['percentage', 'fixed'].includes(payload.discountType)) {
    return 'Loai giam gia khong hop le.';
  }

  if (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0) {
    return 'Gia tri giam gia phai lon hon 0.';
  }

  if (payload.discountType === 'percentage' && payload.discountValue > 100) {
    return 'Ma giam gia theo phan tram khong duoc vuot qua 100%.';
  }

  if (!Number.isFinite(payload.minOrderValue) || payload.minOrderValue < 0) {
    return 'Don hang toi thieu khong hop le.';
  }

  if (!Number.isFinite(payload.maxDiscountAmount) || payload.maxDiscountAmount < 0) {
    return 'Gia tri giam toi da khong hop le.';
  }

  if (!Number.isFinite(payload.usageLimit) || payload.usageLimit < 0) {
    return 'Gioi han luot dung khong hop le.';
  }

  if (!(payload.startDate instanceof Date) || Number.isNaN(payload.startDate.getTime())) {
    return 'Ngay bat dau khong hop le.';
  }

  if (!(payload.endDate instanceof Date) || Number.isNaN(payload.endDate.getTime())) {
    return 'Ngay ket thuc khong hop le.';
  }

  if (payload.endDate <= payload.startDate) {
    return 'Ngay ket thuc phai sau ngay bat dau.';
  }

  return null;
}

function buildCouponResponse(coupon, orderTotal) {
  return {
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      isActive: coupon.isActive
    },
    orderTotal,
    discountAmount: 0,
    finalTotal: orderTotal
  };
}

export async function validateCoupon(req, res, next) {
  try {
    const code = normalizeCouponCode(req.body.code);
    const orderTotal = Number(req.body.orderTotal);

    if (!code) {
      return res.status(400).json({ message: 'Vui long nhap ma giam gia.' });
    }

    if (!Number.isFinite(orderTotal) || orderTotal < 0) {
      return res.status(400).json({ message: 'Gia tri don hang khong hop le.' });
    }

    const result = await validateCouponForOrder({ code, orderTotal });

    if (result.errorMessage || !result.coupon) {
      return res.status(400).json({ message: result.errorMessage || 'Ma giam gia khong hop le.' });
    }

    res.json({
      ...buildCouponResponse(result.coupon, orderTotal),
      discountAmount: result.discountAmount,
      finalTotal: result.finalTotal
    });
  } catch (error) {
    next(error);
  }
}

export async function getCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ coupons });
  } catch (error) {
    next(error);
  }
}

export async function getCouponById(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id).populate('createdBy', 'fullName email');

    if (!coupon) {
      return res.status(404).json({ message: 'Khong tim thay ma giam gia.' });
    }

    res.json({ coupon });
  } catch (error) {
    next(error);
  }
}

export async function createCoupon(req, res, next) {
  try {
    const payload = normalizeCouponPayload(req.body);
    const validationError = validateCouponPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingCoupon = await Coupon.findOne({ code: payload.code });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Ma giam gia da ton tai.' });
    }

    const coupon = await Coupon.create({
      ...payload,
      createdBy: req.user._id
    });

    res.status(201).json({ coupon });
  } catch (error) {
    next(error);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    const payload = normalizeCouponPayload(req.body);
    const validationError = validateCouponPayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Khong tim thay ma giam gia.' });
    }

    const duplicateCoupon = await Coupon.findOne({
      code: payload.code,
      _id: { $ne: coupon._id }
    });

    if (duplicateCoupon) {
      return res.status(400).json({ message: 'Ma giam gia da ton tai.' });
    }

    coupon.code = payload.code;
    coupon.name = payload.name;
    coupon.description = payload.description;
    coupon.discountType = payload.discountType;
    coupon.discountValue = payload.discountValue;
    coupon.minOrderValue = payload.minOrderValue;
    coupon.maxDiscountAmount = payload.maxDiscountAmount;
    coupon.usageLimit = payload.usageLimit;
    coupon.startDate = payload.startDate;
    coupon.endDate = payload.endDate;
    coupon.isActive = payload.isActive;

    await coupon.save();

    res.json({ coupon });
  } catch (error) {
    next(error);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Khong tim thay ma giam gia.' });
    }

    await coupon.deleteOne();

    res.json({ message: 'Da xoa ma giam gia thanh cong.' });
  } catch (error) {
    next(error);
  }
}

export async function toggleCouponActive(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: 'Khong tim thay ma giam gia.' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ coupon });
  } catch (error) {
    next(error);
  }
}

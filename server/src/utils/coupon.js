import Coupon from '../models/Coupon.js';

function normalizeCouponCode(code = '') {
  return String(code || '').trim().toUpperCase();
}

function computeDiscountAmount(coupon, orderTotal) {
  const safeTotal = Math.max(Number(orderTotal) || 0, 0);
  let discountAmount = 0;

  if (coupon.discountType === 'percentage') {
    discountAmount = (safeTotal * coupon.discountValue) / 100;

    if (coupon.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, safeTotal);

  return Math.max(Math.round(discountAmount), 0);
}

function validateCouponState(coupon, orderTotal) {
  const now = new Date();
  const safeTotal = Math.max(Number(orderTotal) || 0, 0);

  if (!coupon) {
    return 'Ma giam gia khong ton tai.';
  }

  if (!coupon.isActive) {
    return 'Ma giam gia hien dang tam dung.';
  }

  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return 'Ma giam gia chua den thoi gian ap dung.';
  }

  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return 'Ma giam gia da het han.';
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return 'Ma giam gia da het luot su dung.';
  }

  if (safeTotal < coupon.minOrderValue) {
    return `Don hang chua dat gia tri toi thieu ${coupon.minOrderValue.toLocaleString('vi-VN')} VND de ap dung ma.`;
  }

  return null;
}

async function validateCouponForOrder({
  code,
  orderTotal,
  session = null,
  incrementUsage = false
}) {
  const normalizedCode = normalizeCouponCode(code);
  const safeTotal = Math.max(Number(orderTotal) || 0, 0);

  if (!normalizedCode) {
    return {
      coupon: null,
      couponCode: '',
      discountAmount: 0,
      finalTotal: safeTotal,
      errorMessage: null
    };
  }

  const query = Coupon.findOne({ code: normalizedCode });
  if (session) {
    query.session(session);
  }

  const coupon = await query;
  const errorMessage = validateCouponState(coupon, safeTotal);

  if (errorMessage) {
    return {
      coupon,
      couponCode: normalizedCode,
      discountAmount: 0,
      finalTotal: safeTotal,
      errorMessage
    };
  }

  const discountAmount = computeDiscountAmount(coupon, safeTotal);
  const finalTotal = Math.max(safeTotal - discountAmount, 0);

  if (incrementUsage) {
    coupon.usedCount += 1;
    await coupon.save({ session });
  }

  return {
    coupon,
    couponCode: normalizedCode,
    discountAmount,
    finalTotal,
    errorMessage: null
  };
}

export {
  computeDiscountAmount,
  normalizeCouponCode,
  validateCouponForOrder,
  validateCouponState
};

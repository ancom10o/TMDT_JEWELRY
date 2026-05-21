import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s]{9,15}$/;

function normalizeUserPayload(payload = {}) {
  return {
    role: payload.role,
    isBlocked: typeof payload.isBlocked === 'boolean' ? payload.isBlocked : undefined
  };
}

function buildPublicUser(user) {
  return {
    id: user._id,
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    city: user.city,
    district: user.district,
    ward: user.ward,
    addressLine: user.addressLine,
    role: user.role,
    isBlocked: Boolean(user.isBlocked),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function normalizeProfilePayload(payload = {}) {
  return {
    fullName: payload.fullName?.trim() || '',
    email: payload.email?.trim().toLowerCase() || '',
    phone: payload.phone?.trim() || '',
    address: payload.address?.trim() || '',
    city: payload.city?.trim() || '',
    district: payload.district?.trim() || '',
    ward: payload.ward?.trim() || '',
    addressLine: payload.addressLine?.trim() || ''
  };
}

function validateProfilePayload({ fullName, email, phone }) {
  if (!fullName || fullName.length < 2) {
    return 'Ho ten phai co it nhat 2 ky tu.';
  }

  if (!emailPattern.test(email)) {
    return 'Email khong dung dinh dang.';
  }

  if (phone && !phonePattern.test(phone)) {
    return 'So dien thoai khong hop le.';
  }

  return null;
}

export async function getUsers(req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function getUserOrders(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('_id fullName email phone').lean();

    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
    }

    const orders = await Order.find({ user: user._id })
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ user, orders });
  } catch (error) {
    next(error);
  }
}

export async function getWishlist(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });

    const wishlist = Array.isArray(user?.wishlist) ? [...user.wishlist].reverse() : [];

    res.json({
      wishlist
    });
  } catch (error) {
    next(error);
  }
}

export async function addWishlistItem(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
    }

    const alreadyExists = user.wishlist.some((item) => item.toString() === productId);

    if (!alreadyExists) {
      user.wishlist.push(product._id);
      await user.save();
    }

    res.json({
      message: 'Da them san pham vao danh sach yeu thich.',
      productId: product._id
    });
  } catch (error) {
    next(error);
  }
}

export async function removeWishlistItem(req, res, next) {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
    }

    user.wishlist = user.wishlist.filter((item) => item.toString() !== productId);
    await user.save();

    res.json({
      message: 'Da xoa san pham khoi danh sach yeu thich.',
      productId
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const payload = normalizeUserPayload(req.body);
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
    }

    if (payload.role && !['user', 'admin'].includes(payload.role)) {
      return res.status(400).json({ message: 'Vai tro khong hop le.' });
    }

    if (user._id.toString() === req.user._id.toString() && payload.isBlocked === true) {
      return res.status(400).json({ message: 'Khong the tu khoa tai khoan admin hien tai.' });
    }

    if (payload.role) {
      user.role = payload.role;
    }

    if (typeof payload.isBlocked === 'boolean') {
      user.isBlocked = payload.isBlocked;
    }

    await user.save();

    res.json({
      user: buildPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const payload = normalizeProfilePayload(req.body);
    const validationError = validateProfilePayload(payload);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await User.findOne({
      email: payload.email,
      _id: { $ne: req.user._id }
    }).select('_id');

    if (existingUser) {
      return res.status(409).json({ message: 'Email da duoc su dung.' });
    }

    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
    }

    user.fullName = payload.fullName;
    user.email = payload.email;
    user.phone = payload.phone;
    user.address = payload.address;
    user.city = payload.city;
    user.district = payload.district;
    user.ward = payload.ward;
    user.addressLine = payload.addressLine;

    await user.save();

    res.json({
      message: 'Da cap nhat ho so.',
      user: buildPublicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

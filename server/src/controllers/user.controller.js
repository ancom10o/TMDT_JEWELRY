import Product from '../models/Product.js';
import User from '../models/User.js';

function normalizeUserPayload(payload = {}) {
  return {
    role: payload.role,
    isBlocked: typeof payload.isBlocked === 'boolean' ? payload.isBlocked : undefined
  };
}

export async function getUsers(req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
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
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

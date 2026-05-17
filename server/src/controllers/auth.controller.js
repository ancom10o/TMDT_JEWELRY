import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s]{9,15}$/;

function sanitizeAuthPayload(payload = {}) {
  return {
    fullName: payload.fullName?.trim() || '',
    email: payload.email?.trim().toLowerCase() || '',
    password: payload.password || '',
    phone: payload.phone?.trim() || '',
    address: payload.address?.trim() || ''
  };
}

function validateRegisterInput({ fullName, email, password, phone }) {
  if (!fullName || !email || !password) {
    return 'Vui long nhap du thong tin.';
  }

  if (fullName.length < 2) {
    return 'Ho ten phai co it nhat 2 ky tu.';
  }

  if (!emailPattern.test(email)) {
    return 'Email khong dung dinh dang.';
  }

  if (password.length < 6) {
    return 'Mat khau phai co it nhat 6 ky tu.';
  }

  if (phone && !phonePattern.test(phone)) {
    return 'So dien thoai khong hop le.';
  }

  return null;
}

function validateLoginInput({ email, password }) {
  if (!email || !password) {
    return 'Vui long nhap email va mat khau.';
  }

  if (!emailPattern.test(email)) {
    return 'Email khong dung dinh dang.';
  }

  return null;
}

function buildAuthResponse(user) {
  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      isBlocked: Boolean(user.isBlocked)
    },
    token: generateToken(user._id)
  };
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, phone, address } = sanitizeAuthPayload(req.body);
    const validationError = validateRegisterInput({ fullName, email, password, phone });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email da duoc su dung.' });
    }

    const user = await User.create({ fullName, email, password, phone, address });

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = sanitizeAuthPayload(req.body);
    const validationError = validateLoginInput({ email, password });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email hoac mat khau khong dung.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Tai khoan cua ban dang bi khoa.' });
    }

    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res) {
  res.json({
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      role: req.user.role,
      isBlocked: Boolean(req.user.isBlocked)
    }
  });
}

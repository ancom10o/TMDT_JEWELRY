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
    address: payload.address?.trim() || '',
    city: payload.city?.trim() || '',
    district: payload.district?.trim() || '',
    ward: payload.ward?.trim() || '',
    addressLine: payload.addressLine?.trim() || ''
  };
}

function validateRegisterInput({ fullName, email, password, phone }) {
  if (!fullName || !email || !password) {
    return 'Vui lòng nhập đầy đủ thông tin.';
  }

  if (fullName.length < 2) {
    return 'Họ tên phải có ít nhất 2 ký tự.';
  }

  if (!emailPattern.test(email)) {
    return 'Email không đúng định dạng.';
  }

  if (password.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }

  if (phone && !phonePattern.test(phone)) {
    return 'Số điện thoại không hợp lệ.';
  }

  return null;
}

function validateLoginInput({ email, password }) {
  if (!email || !password) {
    return 'Vui lòng nhập email và mật khẩu.';
  }

  if (!emailPattern.test(email)) {
    return 'Email không đúng định dạng.';
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
      city: user.city,
      district: user.district,
      ward: user.ward,
      addressLine: user.addressLine,
      role: user.role,
      isBlocked: Boolean(user.isBlocked)
    },
    token: generateToken(user._id)
  };
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, phone, address, city, district, ward, addressLine } = sanitizeAuthPayload(req.body);
    const validationError = validateRegisterInput({ fullName, email, password, phone });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã được sử dụng.' });
    }

    const user = await User.create({ fullName, email, password, phone, address, city, district, ward, addressLine });

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
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa.' });
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
      city: req.user.city,
      district: req.user.district,
      ward: req.user.ward,
      addressLine: req.user.addressLine,
      role: req.user.role,
      isBlocked: Boolean(req.user.isBlocked)
    }
  });
}

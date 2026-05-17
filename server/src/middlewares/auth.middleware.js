import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Ban can dang nhap de tiep tuc.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token khong hop le.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Tai khoan cua ban dang bi khoa.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Phien dang nhap khong hop le.' });
  }
}

export async function optionalProtect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.isBlocked) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
}

export function admin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Ban khong co quyen truy cap tai nguyen nay.' });
  }

  next();
}

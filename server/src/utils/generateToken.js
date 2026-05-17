import jwt from 'jsonwebtoken';
import env from '../config/env.js';

function generateToken(userId) {
  return jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

export default generateToken;

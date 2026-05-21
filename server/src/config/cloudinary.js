import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret
});

export function assertCloudinaryConfigured() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    const error = new Error('Chua cau hinh Cloudinary. Vui long them CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vao file .env.');
    error.statusCode = 500;
    throw error;
  }
}

export default cloudinary;

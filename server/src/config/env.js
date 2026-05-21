import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://ha2ca4_db_user:RgL4vRrcZvzPlBzi@db.8dggdhj.mongodb.net/jewelry-shop?retryWrites=true&w=majority&appName=db',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    productFolder: process.env.CLOUDINARY_PRODUCT_FOLDER || 'jewel-aura/products'
  }
};

export default env;

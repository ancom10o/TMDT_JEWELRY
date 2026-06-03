import dotenv from 'dotenv';

dotenv.config();

function parseClientUrls() {
  const urls = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return urls.length > 0 ? urls : ['http://localhost:5173'];
}

const clientUrls = parseClientUrls();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://ha2ca4_db_user:RgL4vRrcZvzPlBzi@db.8dggdhj.mongodb.net/jewelry-shop?retryWrites=true&w=majority&appName=db',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: clientUrls[0],
  clientUrls
};

export default env;

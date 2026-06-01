import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cartRoutes from './routes/cart.routes.js';
import categoryRoutes from './routes/category.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import healthRoutes from './routes/health.routes.js';
import homeRoutes from './routes/home.routes.js';
import orderRoutes from './routes/order.routes.js';
import productRoutes from './routes/product.routes.js';
import siteSettingRoutes from './routes/siteSetting.routes.js';
import userRoutes from './routes/user.routes.js';
import env from './config/env.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectory = path.resolve(__dirname, '../public');

function createImagePlaceholderSvg(imagePath) {
  const rawName = path.basename(imagePath, path.extname(imagePath));
  const displayName = rawName
    .split('-')
    .filter(Boolean)
    .slice(0, 3)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fffdf8" />
          <stop offset="55%" stop-color="#f4ead2" />
          <stop offset="100%" stop-color="#d4af37" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="20%" r="55%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="1200" rx="72" fill="url(#bg)" />
      <rect x="90" y="90" width="1020" height="1020" rx="54" fill="#ffffff" fill-opacity="0.55" />
      <circle cx="600" cy="360" r="250" fill="url(#glow)" />
      <g fill="none" stroke="#0f172a" stroke-opacity="0.15">
        <circle cx="600" cy="520" r="170" stroke-width="16" />
        <path d="M455 520h290" stroke-width="14" stroke-linecap="round" />
        <path d="M600 350v340" stroke-width="14" stroke-linecap="round" />
      </g>
      <text
        x="600"
        y="860"
        text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif"
        font-size="54"
        font-weight="700"
        letter-spacing="10"
        fill="#0f172a"
      >
        JEWELAURA
      </text>
      <text
        x="600"
        y="930"
        text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif"
        font-size="34"
        font-weight="500"
        letter-spacing="4"
        fill="#6b7280"
      >
        ${displayName || 'Luxury Jewelry'}
      </text>
    </svg>
  `.trim();
}

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));
app.use('/images', express.static(path.join(publicDirectory, 'images')));
app.get('/images/:group/:filename', (req, res) => {
  const svg = createImagePlaceholderSvg(req.params.filename);
  res.type('image/svg+xml').send(svg);
});

app.use('/api/health', healthRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/site-settings', siteSettingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

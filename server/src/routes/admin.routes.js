import { Router } from 'express';
import {
  createBanner,
  deleteBanner,
  getBanners,
  updateBanner
} from '../controllers/banner.controller.js';
import {
  exportMonthlyRevenueExcel,
  exportProductsExcel,
  getDashboardStats
} from '../controllers/admin.controller.js';
import { getAdminProducts } from '../controllers/product.controller.js';
import {
  createHomeSection,
  deleteHomeSection,
  getAdminHomeSections,
  reorderHomeSections,
  updateHomeSection
} from '../controllers/homeSection.controller.js';
import {
  getAdminSiteSettings,
  updateAdminSiteSettings
} from '../controllers/siteSetting.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect, admin);
router.get('/dashboard', getDashboardStats);
router.get('/products', getAdminProducts);
router.get('/exports/products', exportProductsExcel);
router.get('/exports/revenue', exportMonthlyRevenueExcel);
router.get('/homepage', getAdminHomeSections);
router.get('/site-settings', getAdminSiteSettings);
router.put('/site-settings', updateAdminSiteSettings);
router.post('/homepage/sections', createHomeSection);
router.put('/homepage/sections/:id', updateHomeSection);
router.delete('/homepage/sections/:id', deleteHomeSection);
router.patch('/homepage/sections/reorder', reorderHomeSections);
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

export default router;

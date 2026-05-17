import { Router } from 'express';
import {
  createBanner,
  deleteBanner,
  getBanners,
  updateBanner
} from '../controllers/banner.controller.js';
import { getDashboardStats } from '../controllers/admin.controller.js';
import {
  createHomeSection,
  deleteHomeSection,
  getAdminHomeSections,
  reorderHomeSections,
  updateHomeSection
} from '../controllers/homeSection.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect, admin);
router.get('/dashboard', getDashboardStats);
router.get('/homepage', getAdminHomeSections);
router.post('/homepage/sections', createHomeSection);
router.put('/homepage/sections/:id', updateHomeSection);
router.delete('/homepage/sections/:id', deleteHomeSection);
router.patch('/homepage/sections/reorder', reorderHomeSections);
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

export default router;

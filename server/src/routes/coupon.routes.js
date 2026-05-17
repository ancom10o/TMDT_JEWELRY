import { Router } from 'express';
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  getCoupons,
  toggleCouponActive,
  updateCoupon,
  validateCoupon
} from '../controllers/coupon.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/validate', validateCoupon);

router.use(protect, admin);
router.get('/', getCoupons);
router.get('/:id', getCouponById);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);
router.patch('/:id/toggle-active', toggleCouponActive);

export default router;

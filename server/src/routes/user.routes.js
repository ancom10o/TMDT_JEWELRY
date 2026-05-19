import { Router } from 'express';
import {
  addWishlistItem,
  getUserOrders,
  getUsers,
  getWishlist,
  removeWishlistItem,
  updateProfile,
  updateUser
} from '../controllers/user.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addWishlistItem);
router.delete('/wishlist/:productId', removeWishlistItem);
router.put('/me', updateProfile);

router.use(admin);
router.get('/', getUsers);
router.get('/:id/orders', getUserOrders);
router.put('/:id', updateUser);

export default router;

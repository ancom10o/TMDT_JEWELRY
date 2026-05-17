import { Router } from 'express';
import {
  addWishlistItem,
  getUsers,
  getWishlist,
  removeWishlistItem,
  updateUser
} from '../controllers/user.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addWishlistItem);
router.delete('/wishlist/:productId', removeWishlistItem);

router.use(admin);
router.get('/', getUsers);
router.put('/:id', updateUser);

export default router;

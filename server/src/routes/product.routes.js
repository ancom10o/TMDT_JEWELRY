import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductDetail,
  getProducts,
  updateProduct
} from '../controllers/product.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getProducts);
router.get('/:slugOrId', getProductDetail);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;

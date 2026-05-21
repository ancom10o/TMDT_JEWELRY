import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductDetail,
  getProducts,
  uploadProductImages,
  updateProduct
} from '../controllers/product.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import { uploadProductImages as productImageUpload } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/', getProducts);
router.post('/upload-images', protect, admin, productImageUpload.array('images', 8), uploadProductImages);
router.get('/:slugOrId', getProductDetail);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;

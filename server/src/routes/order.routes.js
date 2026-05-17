import { Router } from 'express';
import {
  cancelMyOrder,
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { admin, optionalProtect, protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', optionalProtect, createOrder);
router.use(protect);
router.get('/my-orders', getMyOrders);
router.patch('/:id/cancel', cancelMyOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', admin, updateOrderStatus);

export default router;

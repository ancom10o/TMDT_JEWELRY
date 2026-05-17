import { Router } from 'express';
import { getPublicHomeSections } from '../controllers/homeSection.controller.js';

const router = Router();

router.get('/', getPublicHomeSections);

export default router;

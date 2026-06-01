import { Router } from 'express';
import { getPublicSiteSettings } from '../controllers/siteSetting.controller.js';

const router = Router();

router.get('/', getPublicSiteSettings);

export default router;

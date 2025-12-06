import { Router } from 'express';
import { getNetWorth } from '../controllers/statsControllers.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyFirebaseToken);

router.get('/net-worth', getNetWorth);

export default router;
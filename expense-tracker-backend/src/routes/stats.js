import { Router } from 'express';
import { getNetWorth, getSavingsStats } from '../controllers/statsControllers.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyFirebaseToken);

router.get('/net-worth', getNetWorth);
router.get('/savings', getSavingsStats);

export default router;
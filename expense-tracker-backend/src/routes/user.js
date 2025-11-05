import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyFirebaseToken);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export default router;
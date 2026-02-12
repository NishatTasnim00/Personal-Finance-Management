import express from 'express';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/userController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { avatarUpload } from '../config/cloudinary.js';

const router = express.Router();

router.use(verifyFirebaseToken);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/profile/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
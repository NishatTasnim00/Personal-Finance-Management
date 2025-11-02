import express from 'express';
import { registerUser } from '../controllers/authController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', verifyFirebaseToken, registerUser);

export default router;
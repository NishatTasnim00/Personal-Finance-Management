import express from 'express';
import {
  createGoal, getGoals, updateGoal, deleteGoal, addToGoal
} from '../controllers/savingsGoalController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyFirebaseToken);


router.route('/').get(getGoals).post(createGoal);
router.route('/:id').patch(updateGoal).delete(deleteGoal);
router.route('/:id/add').post(addToGoal);

export default router;
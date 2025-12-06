import { Router } from 'express';
import { createBudget, getBudgets, updateBudget, deleteBudget } from '../controllers/budgetController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();
router.use(verifyFirebaseToken);

router.route('/')
  .post(createBudget)
  .get(getBudgets);

router.route('/:id')
  .patch(updateBudget)
  .delete(deleteBudget);

export default router;
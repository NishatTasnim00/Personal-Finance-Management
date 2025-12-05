// src/routes/expenseRoutes.js
import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';

import { createExpense, getExpenses, updateExpense, deleteExpense } from '../controllers/expenseController.js';

const router = Router();
router.use(verifyFirebaseToken);

router.route('/')
  .post(createExpense)
  .get(getExpenses);

router.route('/:id')
  .patch(updateExpense)
  .delete(deleteExpense);

export default router;
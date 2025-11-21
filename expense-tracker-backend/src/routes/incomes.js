import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import {  getIncomes, createIncome, updateIncome, deleteIncome} from '../controllers/incomeController.js'

const router = express.Router();

// Protect all routes
router.use(verifyFirebaseToken);
// Routes
router.get('/', getIncomes);           
router.post('/', createIncome);         
router.delete('/:id', deleteIncome);   
router.patch('/:id', updateIncome);   

export default router;
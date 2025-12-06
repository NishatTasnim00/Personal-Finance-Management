import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import incomeRoutes from './routes/incomes.js'
import expenseRoutes from './routes/expenses.js'
import budgetRoutes from './routes/budget.js'
import statsRoutes from './routes/stats.js'

dotenv.config();
connectDB();
const corsOptions = {
  origin: 'http://localhost:5173', // Vite default port
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/stats', statsRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
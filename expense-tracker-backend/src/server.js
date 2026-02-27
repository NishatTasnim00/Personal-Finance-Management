import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import morgan from 'morgan';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import incomeRoutes from './routes/incomes.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budget.js';
import savingsGoalRoutes from './routes/savingsGoal.js';
import statsRoutes from './routes/stats.js';
import aiRoutes from './routes/ai.js';

// dotenv.config();
connectDB();
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings-goals', savingsGoalRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });

// Error handler for multer and other middleware errors
app.use((err, req, res, next) => {
  if (err) {
    const message = err.message || 'Something went wrong';
    const status = err.status || 400;
    return res.status(status).json({ status: 'error', message });
  }
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

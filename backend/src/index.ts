import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import financeRoutes from './routes/finance';
import lifeRoutes from './routes/life';
import dashboardRoutes from './routes/dashboard';
import focusRoutes from './routes/focus';

dotenv.config();

const app = express();
const port = 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/life', lifeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/focus', focusRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'AI Personal OS API is running',
    version: '1.0.0',
    endpoints: ['/api/tasks', '/api/ai', '/api/finance', '/api/life', '/api/analytics'],
  });
});

app.listen(port, () => {
  console.log(`🚀 AI Personal OS Backend running on http://localhost:${port}`);
  console.log(`📡 API endpoints available at http://localhost:${port}/api`);
});

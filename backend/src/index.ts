import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import financeRoutes from './routes/finance';
import lifeRoutes from './routes/life';
import dashboardRoutes from './routes/dashboard';
import focusRoutes from './routes/focus';
import analyticsRoutes from './routes/analytics';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5001;

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Allow all origins for Vercel preview domains
  },
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
app.use('/api/health', healthRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'AI Personal OS API is running',
    version: '1.0.0',
    endpoints: ['/api/tasks', '/api/ai', '/api/finance', '/api/life', '/api/analytics'],
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 AI Personal OS Backend running on http://localhost:${port}`);
    console.log(`📡 API endpoints available at http://localhost:${port}/api`);
  });
}

export default app;

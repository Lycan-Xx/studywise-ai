// Load environment variables FIRST, before any other imports
import './config.js';

import express from 'express';
import cors from 'cors';
import router from './routes';
import { verifyEnvironment } from './config.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add user middleware (mock for now)
app.use((req, res, next) => {
  // Mock user authentication
  req.user = { id: 'user123' };
  next();
});

// API routes
app.use('/api', router);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`API endpoints available at http://0.0.0.0:${PORT}/api`);
  
  // Debug environment variables
  verifyEnvironment();
});

// Add TypeScript declaration for req.user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export default app;
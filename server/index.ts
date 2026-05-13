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

// User authentication middleware will be handled by Supabase/Auth0
// This will be replaced with proper authentication middleware

// API routes
app.use('/api', router);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database check endpoint
app.get('/api/db-check', async (req, res) => {
  try {
    const { supabase } = await import('./lib/supabase.js');
    
    // Check if courses table exists
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (error) {
      return res.json({
        status: 'error',
        message: 'Database tables not found or not accessible',
        error: error.message,
        hint: 'Please deploy the schema from docs/new_course_centric_schema.sql'
      });
    }
    
    return res.json({
      status: 'ok',
      message: 'Database tables exist and are accessible',
      tablesChecked: ['courses']
    });
  } catch (error) {
    return res.json({
      status: 'error',
      message: 'Failed to check database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err instanceof Error ? err.message : 'Unknown error occurred'
  });
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
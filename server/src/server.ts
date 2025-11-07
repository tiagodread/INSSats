import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contractRoutes from './routes/contract';
import keysRoutes from './routes/keys';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/contract', contractRoutes);
app.use('/keys', keysRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'INSSats Contract API',
    version: '1.0.0',
    endpoints: {
      'POST /contract/create': 'Create a new Simplicity contract',
      'POST /contract/fund': 'Fund a contract address',
      'POST /contract/pset/create': 'Create a minimal PSET',
      'PATCH /contract/pset/update': 'Update PSET with contract info',
      'PATCH /contract/pset/attach-signature': 'Attach a signature to PSET',
      'POST /contract/pset/finalize': 'Finalize PSET with signatures',
      'POST /contract/broadcast': 'Broadcast transaction to network',
      'GET /contract/transaction/:txid': 'Query transaction status',
      'GET /keys/users': 'List all users with their public keys',
      'GET /keys/users/:userId': 'Get user public key info',
      'GET /health': 'Health check endpoint',
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 INSSats Contract API running on port ${PORT}`);
  console.log(`📝 API documentation available at http://localhost:${PORT}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});

export default app;

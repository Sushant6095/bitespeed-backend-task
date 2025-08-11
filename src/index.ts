import 'dotenv/config';
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { identifyContact, IdentifyRequest } from './contact.service';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello World! TypeScript Express server is running.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /identify route
app.post('/identify', async (req: Request<{}, any, IdentifyRequest>, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    // Validate input - at least one of email or phoneNumber must be provided
    if (!email && !phoneNumber) {
      res.status(400).json({
        error: 'At least one of email or phoneNumber must be provided',
      });
      return;
    }

    const result = await identifyContact(email, phoneNumber);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Close Prisma connection
  await prisma.$disconnect();
  console.log('📦 Database connection closed');

  // Close server
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');

  // Close Prisma connection
  await prisma.$disconnect();
  console.log('📦 Database connection closed');

  // Close server
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0);
  });
});

export default app;

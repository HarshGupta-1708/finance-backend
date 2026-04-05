import 'dotenv/config';
import app from './app';
import { prisma } from './config/database';
import { validateEnv } from './utils/validateEnv';

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, async () => {
  try {
    // Validate environment variables at runtime startup
    validateEnv();

    await prisma.$connect();
    console.log('✅ Database connected');
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ API docs at http://localhost:${PORT}/api/docs`);
  } catch (error) {
    console.error('❌ Failed to start server:', error instanceof Error ? error.message : error);
    // In production, exit immediately if validation fails
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
});

const shutdown = async () => {
  console.log('Shutdown signal received, closing server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default server;

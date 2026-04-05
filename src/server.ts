import 'dotenv/config';
import app from './app';
import { prisma } from './config/database';

const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log('Database connected');
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API docs at http://localhost:${PORT}/api/docs`);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
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

import app from './src/app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';

async function startServer() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`JewelAura API is running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

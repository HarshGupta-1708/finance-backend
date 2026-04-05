/**
 * Validate required environment variables at runtime (server startup)
 * Called inside server.listen callback to ensure env vars are loaded
 */
export const validateEnv = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'NODE_ENV',
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}. ` +
        `Please check your .env file.`,
    );
  }

  console.log('✅ All required environment variables are configured');
};

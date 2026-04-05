/**
 * Validate required environment variables at runtime (server startup)
 * Called inside server.listen callback to ensure env vars are loaded
 */
export const validateEnv = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    const warnings = missingEnvVars.map((v) => `  ⚠️  ${v}`).join('\n');
    console.warn(`\n⚠️  Missing environment variables:\n${warnings}\n`);

    // In production, this would be critical
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Critical: Cannot start server without required environment variables in production!');
      throw new Error(
        `Missing required environment variables in production: ${missingEnvVars.join(', ')}`,
      );
    }

    console.warn('⚠️  Server may not function properly without these variables.\n');
    return;
  }

  console.log('✅ All required environment variables are configured');
};

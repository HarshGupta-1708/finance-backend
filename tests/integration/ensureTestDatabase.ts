export const ensureSafeIntegrationDatabase = () => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      'Integration tests require TEST_DATABASE_URL. Refusing to run against the default DATABASE_URL.',
    );
  }
};

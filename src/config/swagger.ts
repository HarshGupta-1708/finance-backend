import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description: 'Finance Data Processing and Access Control Backend',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Harsh Gupta' },
            email: { type: 'string', example: 'harsh@example.com' },
            password: { type: 'string', minLength: 8 },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'harsh@example.com' },
            password: { type: 'string', minLength: 1 },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Salary' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            description: { type: 'string', nullable: true },
            isActive: { type: 'boolean', example: true },
          },
        },
        FinancialRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', example: 5000.0 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            categoryId: { type: 'integer', example: 1 },
            recordDate: { type: 'string', format: 'date', example: '2026-04-05' },
            notes: { type: 'string', nullable: true },
            userId: { type: 'string', format: 'uuid' },
            createdBy: { type: 'string', format: 'uuid' },
            updatedBy: { type: 'string', format: 'uuid', nullable: true },
            category: { $ref: '#/components/schemas/Category' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
});

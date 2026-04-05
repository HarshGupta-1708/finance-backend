# Finance Dashboard API

Secure, role-based finance data processing backend built with Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT, and Redis-backed rate limiting.

## Features
- JWT authentication (`register`, `login`, `me`, `bootstrap-admin`)
- Role-based access control (`VIEWER`, `ANALYST`, `ADMIN`)
- User management (admin-only): create, list, get-by-id, role update, status toggle, soft delete
- Category normalization with dedicated category catalog and admin category management
- Financial records CRUD with soft delete, creator/updater tracking, and ownership checks
- Filtering, search, and pagination for records and users
- Dashboard analytics: summary, category breakdown, monthly trends, recent activity
- Audit logging for record create, update, and delete actions
- Zod validation and centralized error handling
- Swagger UI docs at `/api/docs`
- Jest unit + integration test scaffolding
- Rich demo seed data across multiple users, months, categories, and soft-delete states

## Stack
- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- JWT (`jsonwebtoken`) + `bcryptjs`
- Redis (`ioredis`) + `express-rate-limit` + `rate-limit-redis`
- Zod
- Jest + Supertest

## Project Structure

```text
finance-backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── users/
│   │   ├── records/
│   │   └── dashboard/
│   ├── types/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── env.setup.ts
│   └── setup.ts
├── .env.example
├── .gitignore
├── jest.config.ts
├── package.json
└── tsconfig.json
```

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
# Edit .env (DATABASE_URL, JWT_SECRET, REDIS_URL)
```

### 3) Set up database

```bash
npm run db:migrate
npm run db:generate
npm run db:seed
```

### 4) Run development server

```bash
npm run dev
```

- Server: `http://localhost:3000`
- Docs: `http://localhost:3000/api/docs`

### 5) Run tests

```bash
npm test
npm run test:all
npm run test:unit
npm run test:integration
```

Integration tests require a dedicated test database:
```bash
export TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_db_test"
npm run test:integration
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*

# PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_db"
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_db_test"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379
RATE_LIMIT_USE_REDIS=false

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Default Seed Users

| Email | Password | Role |
|---|---|---|
| admin@finance.com | admin@1234 | ADMIN |
| analyst@finance.com | analyst@1234 | ANALYST |
| viewer@finance.com | viewer@1234 | VIEWER |
| ops.analyst@finance.com | opsanalyst@1234 | ANALYST |

Additional seeded user:
- `inactive.viewer@finance.com / viewer@1234` (`VIEWER`, inactive, login should fail)

## Demo Data
- The seed is rerunnable and only clears previously tagged seed records.
- It creates current-year and previous-year data across normalized categories.
- The dataset includes active records, soft-deleted records, delegated admin-created records, and search-friendly notes for verification.
- The current seed inserts 5 users, 23 categories, and 161 tagged financial records.

## API Overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/bootstrap-admin` (only when no active admin exists)
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users (Admin only)
- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

### Categories
- `GET /api/categories`
- `POST /api/categories` (`ADMIN`)
- `PATCH /api/categories/:id` (`ADMIN`)

### Records
- `POST /api/records` (`ANALYST`, `ADMIN`)
- `GET /api/records` (`ANALYST`, `ADMIN`)
- `GET /api/records/:id` (`ANALYST`, `ADMIN`)
- `PATCH /api/records/:id` (`ANALYST`, `ADMIN`)
- `DELETE /api/records/:id` (`ANALYST`, `ADMIN`)

Record payload notes:
- `categoryId` is required instead of a free-text category string.
- `recordDate` uses `YYYY-MM-DD` and is stored as a PostgreSQL `DATE`.
- Admins can optionally create records on behalf of another user by sending `userId`.

### Dashboard
- `GET /api/dashboard/summary` (authenticated)
- `GET /api/dashboard/categories` (`ANALYST`, `ADMIN`)
- `GET /api/dashboard/trends/monthly` (`ANALYST`, `ADMIN`)
- `GET /api/dashboard/activity` (authenticated)

## Notes
- Record soft delete uses `deletedAt` as the single source of truth.
- Financial amounts use `DECIMAL(15,2)` via Prisma `Decimal`.
- Categories are normalized into a separate table and validated against record type.
- Record ownership and audit metadata use `userId`, `createdBy`, and `updatedBy`.
- Rate limits are global + stricter auth limiter.
- App and server entry are separated for testability.
- The auth middleware re-reads the current user from the database on every protected request, so role/status changes take effect immediately.
- The last active admin cannot be demoted, deactivated, or deleted.
- Integration tests refuse to use the default `DATABASE_URL`; set `TEST_DATABASE_URL` explicitly before running them.

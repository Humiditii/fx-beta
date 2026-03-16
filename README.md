# FX Trading App Backend

## Overview
A robust NestJS backend for a multi-currency FX trading application. Built with security, data integrity, and scalability in mind.

### Key Features
- **User Authentication**: Register, Login, OTP Verification, Password Reset.
- **Multi-Currency Wallets**: Supports NGN, USD, EUR, GBP, CAD, JPY.
- **Real-time FX Rates**: Integrated with ExchangeRate-API, cached in Redis with exponential backoff retries.
- **Double-Entry Ledger**: Ensures all financial movements are perfectly balanced and auditable.
- **Serialized Transactions**: Prevents double-spending and race conditions using `SERIALIZABLE` isolation level and `SELECT FOR UPDATE`.
- **Idempotency**: Prevents duplicate transaction processing via `Idempotency-Key` headers.
- **Administrative Control**: RBAC (Admin/User), User Management, Global Transaction View, System Audit Logs.
- **Modern Standards**: NestJS 11, TypeORM, PostgreSQL, Redis, Swagger.

---

## Tech Stack
- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Caching/Idempotency**: [Redis](https://redis.io/)
- **Email**: [Nodemailer](https://nodemailer.com/) (Gmail SMTP)
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- FX API Key (from [ExchangeRate-API](https://www.exchangerate-api.com))

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Fill in GMAIL_USER, GMAIL_APP_PASSWORD, and FX_API_KEY
   ```
4. Spin up infrastructure (Database & Redis) or create them manually:
   ```bash
   docker-compose up -d
   ```
   *This automatically creates the `fx_trading` database and starts Redis.*
5. Run the application:
   ```bash
   npm run start:dev
   ```

### Admin Access

For security, there is no public endpoint to register as an admin. To access administrative features during testing:

1. **Register & Verify**: Create a normal user account via `/auth/register` and verify it with the OTP sent to your email.
2. **Promote via Database**: Manually update your role in the `users` table:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. **Login**: Sign in via `/auth/signin`. Your JWT will now contain the `admin` role, granting access to `/admin/*` endpoints and the full Audit Log.

### API Documentation
Once the app is running, access the interactive Swagger documentation at:
`http://localhost:3000/api-docs`

---

## Testing
Comprehensive test suite covering critical financial logic.
```bash
npm run test           # Run unit tests
npm run test:cov       # Run with coverage report
```

## Database Migrations

This project uses TypeORM migrations to manage database schema changes reliably across environments.

### Development vs Production
- **Development**: By default, `synchronize: true` is enabled (when `NODE_ENV=development`). TypeORM will automatically sync your entity changes to the database.
- **Production**: `synchronize` is disabled. You **must** generate and run migrations to apply schema changes.

### Common Commands

#### 1. Generate a Migration
If you make changes to any entity file (e.g., adding a new column), generate a migration file that captures the difference:
```bash
npm run migration:generate --name=AddUserBio
```
*This will create a new file in `src/core/database/migrations/`.*

#### 2. Run Pending Migrations
Apply all migrations that haven't been run yet:
```bash
npm run migration:run
```

#### 3. Revert Last Migration
If something went wrong, you can undo the last migration:
```bash
npm run migration:revert
```

---

## Architecture & Recommendations
- See [diagrams.md](./diagrams.md) for architectural flows and database schema.
- See [recommendations.md](./recommendations.md) for scaling strategies and architectural assumptions.

### Ledger Logic
Every transaction creates at least two ledger entries. For example, a "Fund Wallet" operation:
1. `CREDIT` User Wallet (NGN)
2. (System counterpart recorded in audit logs)

A currency conversion (NGN to USD):
1. `DEBIT` User NGN Wallet
2. `CREDIT` User USD Wallet
3. Rate and reference captured in `Transaction` and `FxRateLog`.

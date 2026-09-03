# Smart Logistics Backend

Phase 1 API for the multi-tenant logistics platform.

## Structure

```text
backend/src/
  config/        Environment and database configuration
  controllers/   HTTP request orchestration
  middleware/    Authentication, RBAC, validation, errors
  models/        Mongoose schemas and domain types
  repositories/  Persistence access and geospatial queries
  routes/        Versioned HTTP routes
  services/      Business rules and transactions
  types/         Express and shared types
  app.ts         Express composition
  server.ts      Runtime entry point
```

## Run

1. Copy `.env.example` to `.env` and set `JWT_SECRET` and `MONGODB_URI`.
2. Run `npm install`.
3. Run `npm run dev` or `npm run build && npm start`.

Registering publicly creates merchant users only. Administrative and operational roles must be provisioned by an administrator.

# Routecraft

Routecraft is a multi-tenant last-mile logistics platform for merchants, drivers, dispatchers, and operations teams. It combines order management, driver tracking, automated dispatch, fleet maintenance, and delivery operations in one workspace.

> This repository is an active project and reference implementation. Review authentication, authorization, data retention, infrastructure, and third-party integrations before using it with real customer or driver data.

## What It Includes

- Merchant operations portal built with React, TypeScript, and Vite
- Node.js and Express API with MongoDB and Mongoose
- JWT authentication with refresh-token support
- Order creation, tracking, status progression, and CSV import workflows
- Driver location updates and geospatial nearby-driver queries
- Flutter driver application for Android and iOS
- Optional n8n workflows for dispatch, proximity notifications, and nightly maintenance
- Admin-facing views for merchant CRM, fleet operations, and driver settlements

## Architecture

```text
React web portal  ─┐
Flutter driver app ─┼─> Express API ──> MongoDB
                   │          │
                   └──────────┴────> n8n automation ──> notification / ERP services
```

| Area | Location | Main technologies |
| --- | --- | --- |
| Backend API | `backend/` | Node.js, Express, TypeScript, MongoDB, Mongoose |
| Web portal | `frontend/` | React, TypeScript, Vite, Axios |
| Driver app | `mobile/` | Flutter, Dart, Dio |
| Automation | `automation/n8n/` | n8n workflow JSON |

## Requirements

- Node.js 20 or newer
- npm
- MongoDB 6 or newer, local or hosted
- Flutter SDK for mobile development
- Docker Desktop only if you want to run n8n locally

## Quick Start

### 1. Start the backend

Open PowerShell in the repository root:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
npm install
npm run dev
```

Set a unique `JWT_SECRET` with at least 32 characters in `backend/.env`. Keep `.env` local. It is ignored by Git and must never be committed.

The API starts at `http://localhost:4000`. Verify it with:

```powershell
Invoke-RestMethod http://localhost:4000/health
```

### 2. Start the web portal

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend uses `http://localhost:4000/api/v1` by default. To use another API server, create `frontend/.env.local`:

```dotenv
VITE_API_URL=https://your-api.example.com/api/v1
```

### 3. Run the Flutter app

From the repository root:

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:4000/api/v1
```

Use your computer's LAN address instead of `10.0.2.2` for a physical device. The mobile app stores its access and refresh tokens locally and sends them as bearer tokens.

## Environment Variables

The complete backend template is in [backend/.env.example](backend/.env.example).

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign access tokens; use a unique 32+ character value |
| `JWT_EXPIRES_IN` | Access-token lifetime, such as `15m` |
| `CORS_ORIGIN` | Comma-separated allowed web origins |
| `N8N_BASE_URL` | Optional n8n base URL |
| `N8N_WEBHOOK_SECRET` | Optional shared secret for backend and n8n webhook calls |
| `DISPATCH_RADIUS_METERS` | Driver search radius for automated dispatch |
| `PROXIMITY_RADIUS_METERS` | Proximity notification radius |

Never place secrets in React source, Flutter source, workflow JSON, screenshots, or documentation. Rotate any credential that has previously been committed to a public repository.

## API Overview

The API is versioned under `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/api/v1/auth/register` | Register a merchant |
| `POST` | `/api/v1/auth/login` | Sign in and receive tokens |
| `POST` | `/api/v1/auth/refresh` | Refresh an access token |
| `GET` | `/api/v1/orders` | List authenticated merchant orders |
| `POST` | `/api/v1/orders` | Create an order |
| `PATCH` | `/api/v1/orders/:orderId/assign` | Assign a driver through a protected webhook route |
| `POST` | `/api/v1/drivers/location` | Submit an authenticated driver's location |
| `GET` | `/api/v1/automation/drivers/nearby` | Find nearby idle drivers for n8n |
| `POST` | `/api/v1/automation/maintenance/nightly` | Run nightly maintenance calculations |

Protected endpoints require `Authorization: Bearer <access-token>`. Automation endpoints also require the configured `x-webhook-secret` header.

## n8n Automation

The workflow definitions are in [automation/n8n](automation/n8n). They cover:

- Dispatching new orders to the best nearby driver
- Sending a notification when a driver is near a drop-off
- Calculating nightly vehicle mileage and maintenance flags

See [automation/N8N_SETUP_GUIDE.md](automation/N8N_SETUP_GUIDE.md) for Docker setup, environment configuration, workflow import, and testing. Third-party Slack, SMS, ERP, or Discord credentials must be configured inside your private deployment and must not be added to this repository.

## Development Commands

Backend:

```powershell
cd backend
npm run typecheck
npm run build
```

Frontend:

```powershell
cd frontend
npm run typecheck
npm run build
```

Mobile:

```powershell
cd mobile
flutter analyze
flutter test
```

## Repository Safety

Before pushing, check the files Git will publish:

```powershell
git status --short
git diff --cached --stat
```

The repository ignores `.env` files, dependency folders, build output, and logs. Still review staged files manually before the first push, especially workflow exports and mobile platform configuration.

## Contributing

1. Create a feature branch.
2. Make a focused change and add or update tests where behavior changes.
3. Run the relevant typecheck, build, analysis, and test commands.
4. Keep credentials and customer data out of commits.
5. Open a pull request with a short summary and verification notes.

## License

This project is licensed under the MIT License. See `LICENSE` for details.

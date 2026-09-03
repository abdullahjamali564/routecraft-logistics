# n8n automation

Import the JSON files in `n8n/` into n8n, then configure these environment variables:

- `BACKEND_URL`: reachable backend base URL.
- `N8N_WEBHOOK_SECRET`: shared secret, minimum 16 characters. Configure the same value in the backend.
- `DISPATCH_ESCALATION_WEBHOOK_URL`: Slack incoming webhook or Discord-compatible webhook.

## Webhook payloads

`POST /webhook/order-created` receives an order-created event. The n8n webhook body is under `$json.body`.

`POST /webhook/driver-near-dropoff` receives the same GeoJSON coordinate convention plus `driverId`, `distanceMeters`, and `estimatedArrivalMinutes`. The n8n webhook body is under `$json.body`.

## Backend automation endpoints

- `GET /api/v1/automation/drivers/nearby?latitude=...&longitude=...&radiusMeters=5000` requires `x-webhook-secret`; returns idle drivers sorted by `currentParcelCount`, then `distanceMeters`.
- `PATCH /api/v1/orders/:orderId/assign` requires `x-webhook-secret`; body is `{ "driverId": "..." }` and atomically moves the order to `assigned`.
- `POST /api/v1/automation/maintenance/nightly` requires `x-webhook-secret`; calculates daily vehicle mileage from retained GPS samples and updates `maintenanceFlag`.

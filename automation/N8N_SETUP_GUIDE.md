# n8n Setup Guide for Routecraft

This guide connects the Routecraft backend to the three workflows in `automation/n8n/`:

1. **Dispatch Order**: selects the nearest idle driver with the lowest active parcel count.
2. **Proximity Notification**: sends an SMS when a driver is near a drop-off.
3. **Nightly Maintenance**: calculates vehicle mileage, updates maintenance flags, and sends the result to an ERP endpoint.

## 1. What You Are Setting Up

There are three programs involved:

- **MongoDB** stores orders, drivers, locations, and vehicles.
- **Routecraft backend** runs on port `4000` and contains the business API.
- **n8n** runs on port `5678` and performs dispatch, SMS, and maintenance automation.

The normal local flow is:

```text
Frontend -> backend:4000 -> n8n:5678 -> backend:4000
                                      -> ERP
```

When you finish, opening `http://localhost:5678` should show n8n, and creating an order should create an execution in the **Dispatch Order** workflow.

## 2. Prerequisites

- Node.js and npm for the backend.
- MongoDB running and configured in `backend/.env`.
- Docker Desktop, or another n8n installation method.
- A publicly reachable HTTPS URL for n8n when the backend is not on the same machine.
- An ERP maintenance endpoint if the nightly workflow should synchronize flags externally.

For local development, the backend and n8n can both run on the same computer. In that case use `http://localhost:5678` for the backend's n8n URL. In Docker, `localhost` inside the n8n container means the container itself, so use `http://host.docker.internal:4000` for a backend running on the host.

### 2.1 Install and check Docker Desktop

1. Download Docker Desktop from `https://www.docker.com/products/docker-desktop/`.
2. Install it using the default options.
3. Restart Windows if Docker Desktop asks you to.
4. Open **Docker Desktop** from the Start menu.
5. Wait until Docker Desktop says it is running.
6. Open a new **PowerShell** window in VS Code with **Terminal > New Terminal**.
7. Run this command:

```powershell
docker --version
```

You should see a Docker version. If PowerShell says that `docker` is not recognized, Docker Desktop is not installed or is not running. Fix that before continuing.

### 2.2 Check that the backend prerequisites work

Open another PowerShell terminal and run:

```powershell
node --version
npm --version
```

You should see versions for both commands. MongoDB must also be running. If you do not already have MongoDB, install MongoDB Community Server or use MongoDB Atlas, then make sure the `MONGODB_URI` in `backend/.env` points to it.

## 3. Start the backend before n8n

Do this before testing n8n because n8n calls the backend to find drivers and update maintenance records.

1. In VS Code, open the project folder `D:\DEVELOPMENT\web dev project`.
2. Open a terminal and run:

```powershell
cd "D:\DEVELOPMENT\web dev project\backend"
Copy-Item .env.example .env
notepad .env
```

3. In Notepad, replace `JWT_SECRET` with a random value containing at least 32 characters.
4. Add these lines at the bottom of the file:

```dotenv
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=replace-this-with-the-same-secret-used-in-n8n
DISPATCH_RADIUS_METERS=5000
PROXIMITY_RADIUS_METERS=1000
```

5. Replace the `N8N_WEBHOOK_SECRET` value with one secret of at least 16 characters. Do not include quotation marks.
6. Save and close Notepad.
7. Install backend packages and start the backend:

```powershell
npm install
npm run dev
```

Leave this terminal open. The backend is running correctly when it does not immediately exit with an error. If it reports a MongoDB connection error, start MongoDB or correct `MONGODB_URI` before continuing.

## 4. Start n8n locally with Docker

Open a second PowerShell terminal. Keep the backend terminal running. The following commands create storage so your n8n workflows survive container restarts, then start n8n:

### 4.1 Create persistent n8n storage

Run:

```powershell
docker volume create routecraft_n8n_data
```

You should see `routecraft_n8n_data` printed. This is a Docker-managed folder; do not create a Windows folder with that name.

### 4.2 Start the n8n container

Run this entire command. In PowerShell, the backtick character at the end of each line means the command continues on the next line.

```powershell
docker run -d --name routecraft-n8n `
  -p 5678:5678 `
  -e N8N_SECURE_COOKIE=false `
  -e BACKEND_URL=http://host.docker.internal:4000 `
  -e N8N_WEBHOOK_SECRET=replace-with-a-random-secret-at-least-16-characters `
  -e DISPATCH_RADIUS_METERS=5000 `
  -e ERP_MAINTENANCE_URL=https://your-erp.example.com/api/maintenance `
  -v routecraft_n8n_data:/home/node/.n8n `
  n8nio/n8n:latest
```

What each important option does:

- `-d` runs n8n in the background.
- `--name routecraft-n8n` gives the container a recognizable name.
- `-p 5678:5678` makes n8n available at `http://localhost:5678`.
- `BACKEND_URL` tells n8n where the backend is. `host.docker.internal` means the Windows host from inside Docker.
- `N8N_WEBHOOK_SECRET` is the shared password between n8n and the backend.
- `-v routecraft_n8n_data:/home/node/.n8n` keeps workflows and n8n settings after a restart.

Check that the container is running:

```powershell
docker ps
```

You should see a row whose name is `routecraft-n8n` and whose ports include `0.0.0.0:5678->5678/tcp`.

If you previously created the container, Docker may report a name conflict. Start the existing container instead:

```powershell
docker start routecraft-n8n
```

Now open a browser and go to `http://localhost:5678`. On the first visit, create the n8n owner account. This account is only for signing in to n8n; it is not the Routecraft admin account.

Do not use `N8N_SECURE_COOKIE=false` in a production HTTPS deployment.

Generate one strong secret and use exactly the same value in n8n and the backend. For example, in PowerShell:

```powershell
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$secret
```

## 5. Confirm n8n can reach the backend

Before importing workflows, check the Docker-to-Windows connection. In n8n, click **Overview**, then open the **Executions** or workflow area. If you need to inspect the container log, run:

```powershell
docker logs routecraft-n8n --tail 50
```

There should be no repeating startup error. The backend terminal must still be running. `BACKEND_URL=http://host.docker.internal:4000` is correct when the backend runs directly on Windows. If both programs run directly on Windows, `http://localhost:4000` also works for n8n, but keep the Docker value shown in the command.

## 6. Configure the backend

Copy `backend/.env.example` to `backend/.env` if this has not been done. Set these values:

```dotenv
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_SECRET=the-same-secret-used-by-n8n
DISPATCH_RADIUS_METERS=5000
PROXIMITY_RADIUS_METERS=1000
```

If the backend runs in a Docker container while n8n runs on the host, adjust `N8N_BASE_URL` to the host address reachable from that container. Restart the backend after changing `.env`.

The backend calls these n8n webhook paths:

| Event | Method and path |
| --- | --- |
| Order created | `POST /webhook/order-created` |
| Driver near drop-off | `POST /webhook/driver-near-dropoff` |

The backend authenticates both calls with the `x-webhook-secret` header. n8n uses the same header when calling protected backend automation endpoints.

## 7. Import the workflows

Import one workflow at a time so errors are easy to identify:

1. In the n8n browser page, click **Workflows**.
2. Click **Add workflow**.
3. Open the workflow menu, usually the three-dot menu in the top-right.
4. Choose **Import from File**.
5. Browse to `D:\DEVELOPMENT\web dev project\automation\n8n\dispatch-order.json`.
6. Open the file and wait for the canvas to load.
7. Click **Save**.
8. Repeat steps 2 through 7 for `proximity-notification.json` and `nightly-maintenance.json`.

You should now see three workflows named **Dispatch Order**, **Proximity Notification**, and **Nightly Maintenance**.

The imported workflows use n8n environment expressions such as `{{$env.BACKEND_URL}}`. Confirm that the values are visible to the n8n process before testing. If n8n was started with Docker, recreate the container after changing `-e` values; restarting the backend does not update n8n's environment.

## 8. Configure the ERP maintenance destination

Set `ERP_MAINTENANCE_URL` to an HTTPS endpoint that accepts a JSON `POST`. The nightly workflow sends the backend response's `data` object, shaped like:

```json
{
  "date": "2026-09-03",
  "mileageByVehicle": { "vehicle-id": 12.4 },
  "overdueVehicleIds": ["vehicle-id"]
}
```

If the ERP requires authentication, configure it on **Sync ERP Maintenance Flags** using an n8n credential or an authorization header. Do not put API keys directly in a workflow expression or commit them to this repository.

## 9. Test the webhook workflows

Keep the workflow open in n8n, click **Execute workflow** or use the webhook node's **Test URL**, and send a request with the shared secret:

```powershell
$headers = @{
  "content-type" = "application/json"
  "x-webhook-secret" = "the-same-secret-used-by-n8n"
}
$body = @{
  event = "order.created"
  occurredAt = (Get-Date).ToUniversalTime().ToString("o")
  order = @{
    id = "replace-with-a-real-pending-order-id"
    trackingNumber = "RC-TEST-001"
    pickup = @{ coordinates = @(-74.0060, 40.7128) }
    dropoff = @{ coordinates = @(-73.9857, 40.7484) }
    recipient = @{ phone = "+15551234567" }
  }
} | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Post -Uri "http://localhost:5678/webhook/order-created" -Headers $headers -Body $body
```

For a real dispatch test, the coordinates must be near an idle driver with a valid `lastKnownLocation`, and the order must still be `pending`. The workflow can safely report no driver; the assign step only runs with a selected driver.

For proximity testing, use a payload containing `body.order.recipient.phone` and `body.order.estimatedArrivalMinutes`, or move a real driver's GPS location within `PROXIMITY_RADIUS_METERS` of an active order's drop-off.

## 10. Test nightly maintenance

Do not wait until 02:00 for the first test. Open **Nightly Maintenance**, run it manually, and confirm:

1. **Tally Mileage And Flag ERP** returns HTTP 200 from the backend.
2. Vehicle odometers and `maintenanceFlag` are updated in MongoDB.
3. **Sync ERP Maintenance Flags** receives the returned `data` object.

The schedule is `0 2 * * *`, which means 02:00 according to n8n's configured timezone. Set the workflow or n8n instance timezone explicitly if 02:00 must be a particular business timezone.

## 11. Activate and monitor

After successful tests:

1. Activate **Dispatch Order**, **Proximity Notification**, and **Nightly Maintenance**.
2. Confirm the webhook nodes use their **Production URL** when the workflows are active.
3. Create a test order from the frontend and inspect the execution in n8n.
4. Check backend logs for `Unable to emit ... webhook` messages.
5. Configure n8n execution retention, backups for the `routecraft_n8n_data` volume, and an error workflow or alert for failed executions.

## 12. Production checklist

- Run n8n behind HTTPS and set `WEBHOOK_URL` to the public n8n base URL.
- Replace `N8N_SECURE_COOKIE=false` with the secure-cookie default.
- Use a managed database or persistent volume for n8n data.
- Restrict access to n8n's editor and protect the owner account with strong credentials and 2FA where available.
- Store secrets in the deployment secret manager, not in JSON exports or source control.
- Restrict inbound webhook traffic at the network layer where possible; the shared header is an application-level control, not a substitute for HTTPS.
- Add idempotency or duplicate-event handling before enabling retries for dispatch and SMS in a high-volume deployment.

## Troubleshooting

- **No n8n execution appears**: check that `N8N_BASE_URL` is set in the backend process and that the backend can resolve the n8n host and port.
- **401 from the backend**: compare `N8N_WEBHOOK_SECRET` character-for-character and verify the header is `x-webhook-secret`.
- **No driver is assigned**: verify MongoDB has a GeoJSON `2dsphere` location, the driver status is `idle`, the order is `pending`, and the coordinates are `[longitude, latitude]`.
- **Nightly schedule runs at the wrong hour**: check the n8n timezone and the workflow schedule settings.
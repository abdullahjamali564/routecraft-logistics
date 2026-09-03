# Routecraft: Multi-Tenant Delivery & Logistics Platform

## Executive Summary

**Routecraft** is a comprehensive **Smart Logistics Platform** designed to manage last-mile delivery operations at scale. It's a multi-tenant SaaS solution that connects merchants (businesses that need deliveries), drivers (who fulfill deliveries), and internal operations teams into a unified control system. The platform automatically dispatches orders to nearby drivers, tracks deliveries in real-time, and provides merchant and operational dashboards for complete visibility.

---

## The Problem It Solves

### Current State (The Problem)
Logistics and last-mile delivery is fragmented and inefficient:
- **Manual dispatch**: Orders are manually assigned to drivers, wasting time and creating bottlenecks
- **Visibility gaps**: No real-time tracking of where drivers are or what orders are being delivered
- **Coordination issues**: Drivers don't know where to pick up orders, merchants don't know delivery status
- **Scale limitations**: Managing hundreds or thousands of daily deliveries manually is impossible
- **Vehicle maintenance blindness**: No tracking of vehicle health until breakdowns occur
- **Payment complexity**: Manual settlement calculations between merchants and drivers
- **Communication silos**: No automated notifications to customers or stakeholders about delivery status

### Routecraft's Solution
Routecraft automates and centralizes the entire last-mile delivery workflow:
1. **Automated Dispatch** via geospatial queries and n8n workflows
2. **Real-time GPS Tracking** of driver locations and order status
3. **Smart Merchant Portal** for creating and tracking deliveries
4. **Driver Mobile App** for receiving orders and executing pickups/dropoffs
5. **Operations Dashboard** for admins to manage merchants, fleet, and settlements
6. **Predictive Maintenance** tracking vehicle health proactively
7. **Customer Notifications** via SMS when drivers are nearby

---

## Users & Roles

The platform serves **4 primary user types**, each with distinct workflows:

### 1. **Merchants** (E-commerce stores, restaurants, logistics companies)
**Who they are:** Business owners who need to ship parcels to customers
- Operate small-to-enterprise scale delivery networks
- Currently manage their own delivery logistics or use costly couriers

**Their Goals:**
- Create and track orders without manual intervention
- Reduce delivery costs
- Provide customers with delivery visibility
- Scale delivery volume without hiring more staff

**What they can do:**
- Sign up for account (Merchant user role)
- Create orders individually via web form or bulk import via CSV
- Specify pickup & dropoff addresses with GPS coordinates
- Set pricing, weight, dimensions, and special notes
- Track order status in real-time (Pending → Assigned → Picked up → In transit → Delivered)
- View delivery performance metrics (on-time rate, active deliveries, exceptions)
- Export order data for reconciliation

**Access:** Web dashboard (React frontend)

---

### 2. **Drivers** (Fulfillment workforce)
**Who they are:** Individual contractors or employees who physically deliver parcels
- Move between idle, en-route, and off-duty statuses
- Report to a dispatcher or self-manage through the app

**Their Goals:**
- Receive delivery jobs efficiently
- Know exactly where to go (pickup → dropoff)
- Confirm pickup/dropoff completion
- Track daily earnings

**What they can do:**
- Log in via mobile app with JWT auth
- View their **manifest** (list of assigned orders for the day)
- See pickup & dropoff addresses on a map
- Scan barcodes to confirm pickup/dropoff (barcode validation prevents wrong deliveries)
- Report GPS location continuously (latitude, longitude, captured timestamp)
- Track payment earned from completed deliveries
- Receive SMS/push notifications when new orders are assigned

**Access:** Native mobile app (Flutter for iOS/Android)

---

### 3. **Dispatchers** (Internal operations staff)
**Who they are:** Operations team members who manage the delivery workflow
- May work for Routecraft or the merchant

**Their Goals:**
- Assign orders to drivers manually when automation isn't suitable
- Monitor delivery health
- Respond to exceptions (failed deliveries, customer complaints)

**What they can do:**
- Access the full merchant portal (same as merchants)
- Manually assign orders to specific drivers
- Query nearby drivers by coordinates and radius
- Update order status as deliveries progress
- Export reports for analysis

**Access:** Web dashboard (same React app as merchants)

---

### 4. **Admins** (Routecraft internal team)
**Who they are:** Platform administrators managing the entire ecosystem
- Access all merchants, drivers, and operations data
- Configure system-wide settings

**Their Goals:**
- Manage merchant accounts and onboarding
- Monitor delivery network health
- Manage driver settlement payouts
- Track vehicle fleet maintenance

**What they can do:**
- Full CRM access: view all merchants, billing tiers (Starter/Growth/Enterprise), volume metrics, open support tickets
- Fleet management: register vehicles, track odometer, manage maintenance schedules
- ERP settlement: review driver payouts, approve pay runs, export payroll data
- Configure system parameters (dispatch radius, pricing tiers)
- View cross-tenant analytics and platform health

**Access:** Web dashboard with "Internal Operations" section (same app, different routes)

---

## Architecture & Data Flow

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTECRAFT ECOSYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

         ┌──────────────┐         ┌──────────────┐
         │   MERCHANTS  │         │   DRIVERS    │
         │  (Web Portal)│         │(Mobile App)  │
         └──────┬───────┘         └──────┬───────┘
                │                        │
                │ Create Orders          │ GPS Location
                │ Track Delivery         │ Scan Barcode
                │ View Reports           │ Confirm Pickup/Dropoff
                │                        │
                └────────────┬───────────┘
                             │
                    ┌────────▼────────┐
                    │  BACKEND API    │
                    │ (Node.js/Mongo) │
                    └────────┬────────┘
                             │
        ┌────────────┬────────┼────────┬────────────┐
        │            │        │        │            │
        │     ┌──────▼──┐     │   ┌────▼─────┐    │
        │     │ Routes  │     │   │Services  │    │
        │     │ Orders  │     │   │Orders    │    │
        │     │ Auth    │     │   │Auth      │    │
        │     │ Users   │     │   │Location  │    │
        │     └────┬────┘     │   └────┬─────┘    │
        │          │         │         │           │
        └─────┬────┼─────────┼────┬────┴───────────┘
              │    │         │    │
       ┌──────▼────┴─┐   ┌────▼────┐
         │   MongoDB   │   │n8n Auto-│
      │  Database   │   │mation   │
         │             │   │(Webhook)│
       └────────┬────┘   └────┬────┘
                │              │
                │              │
                │              │
                │       ┌──────▼────────────────┐
                │       │  n8n Workflows        │
                │       │ ┌──────────────────┐  │
                │       │ │Dispatch Order    │  │
                │       │ │Nightly Maint     │  │
                │       │ │Proximity Notif   │  │
                │       │ └────────┬─────────┘  │
                │       └──────────┼────────────┘
                │                  │
                │         ┌────────┴────────────┐
                │         │                     │
                │    ┌───────────┐    ┌────▼──────┐
                │    │   Slack   │    │    ERP    │
                │    │  (Alerts) │    │(Maintenance)
                │    └───────────┘    └───────────┘

        ┌─────────────────────────────────────────┐
        │  ADMIN OPERATIONS DASHBOARD             │
        │  • Merchant CRM                         │
        │  • Fleet Management                     │
        │  • Driver Settlements                   │
        └─────────────────────────────────────────┘
```

### Key Data Models

**Order (Delivery Unit)**
- Unique tracking number (RC-10001, RC-10002, etc.)
- Pickup address (with GPS coordinates for geospatial queries)
- Dropoff address (with GPS coordinates)
- Assigned driver (when matched)
- Stage/Status: pending → assigned → picked_up → in_transit → delivered (or failed)
- Recipient phone & verification PIN (for delivery confirmation)
- Package weight & dimensions
- Price breakdown (base fee + distance + surcharge - discount)
- Proof of delivery URL (photo at delivery point)

**Driver Profile**
- Associated User account
- License number & expiry
- Current vehicle assignment
- Status: idle / en_route / off_duty
- Last known GPS location (2dsphere index for fast geo queries)
- Current parcel count (used for load balancing during dispatch)

**Merchant Profile**
- Associated User account  
- Company name & registration
- Billing terms (prepaid/net_7/net_15/net_30)
- Pricing tier (Starter/Growth/Enterprise)
- Billing email & address

**Vehicle (Fleet Asset)**
- Asset ID & license plate
- Type: motorcycle / van / truck / car
- Current odometer reading
- Last maintenance date & odometer
- Maintenance intervals (km & days)
- Maintenance flag (alerts for service due)
- Status: active / service / decommissioned

---

## User Workflows

### **Merchant Workflow: "Create and Track a Delivery"**

```
1. MERCHANT LOGS IN
   ↓
2. CREATES ORDER (Two Options)
   a) Single Order: 
      - Fill form: tracking ID, pickup addr, dropoff addr, weight, price
      - Validate GPS coordinates
      - Submit → Order created with stage="pending"
   
   b) Bulk Import:
      - Upload CSV with columns: addressLine, city, lat, lng, weight
      - System validates each row
      - Preview and confirm → All rows created
   ↓
3. ORDER DISPATCHED BY OPERATIONS
   - Dispatcher queries nearby idle drivers within 5km
   - Selects driver with lowest parcelCount
   - Assigns the order through the operations dashboard
   - Order stage → "assigned"
   - Driver notified via SMS
   ↓
4. MERCHANT TRACKS DELIVERY
   - Views order in "Tracking" dashboard
   - Real-time status updates: assigned → picked_up → in_transit → delivered
   - Sees estimated arrival time
   - Can export CSV report for reconciliation
   ↓
5. DELIVERY COMPLETE
   - Driver confirms delivery via mobile app (barcode scan)
   - Order stage → "delivered"
   - Proof of delivery photo uploaded
   - Merchant receives confirmation notification
```

---

### **Driver Workflow: "Complete a Delivery Route"**

```
1. DRIVER LOGS INTO MOBILE APP
   - Authenticates with email/password (JWT token)
   - App stores token in shared_preferences
   ↓
2. VIEWS MANIFEST (Assigned Orders)
   - Manifest screen shows all orders assigned to this driver
   - Each order displays: tracking #, pickup address, dropoff address, weight
   - Color-coded status badges
   ↓
3. NAVIGATES TO PICKUP
   - Taps order → maps integration shows pickup location
   - Uses phone GPS for navigation
   - Arrives at pickup point
   ↓
4. CONFIRMS PICKUP
   - Opens mobile_scanner (barcode scanner)
   - Scans order barcode (format validation: must match order's trackingNumber)
   - Confirms action="pickup"
   - POST /api/v1/orders/:orderId/scan with barcode & action
   - Order stage → "picked_up"
   - App UI updates
   ↓
5. CONTINUOUS GPS TRACKING
   - Mobile app sends GPS location every N seconds
   - POST /api/v1/drivers/location with { latitude, longitude, capturedAt }
   - Backend stores location in DriverProfile.lastKnownLocation
   - Backend stores the driver's latest location and retained GPS samples
   ↓
6. DRIVER APPROACHING DROPOFF
   - Operations can monitor the driver's proximity to the dropoff
   ↓
7. CONFIRMS DROPOFF
   - Driver arrives at dropoff location
   - Scans barcode again with action="dropoff"
   - Takes proof-of-delivery photo (image_picker)
   - POST /api/v1/orders/:orderId/scan with barcode & action & photo
   - Order stage → "delivered"
   - Driver's manifest updates
   ↓
8. SETTLEMENT TRACKING
   - Each completed delivery added to driver's earned payout
   - Distance tracked from GPS samples
   - Admin runs nightly maintenance job to calculate daily earnings
```

---

### **Admin Workflow: "Monitor Fleet & Payroll"**

```
1. ADMIN LOGS IN
   - Same web portal as merchants
   - Additional "Internal Operations" nav section visible
   ↓
2. CRM: MERCHANT MANAGEMENT
   - Views all merchants: Northstar Grocers, Aster & Co., etc.
   - Checks tier: Starter / Growth / Enterprise
   - Monitors monthly volume & on-time delivery rate
   - Sees open support tickets (#CLM-19: Lost package)
   - Can add new merchant, adjust billing terms
   ↓
3. FLEET: VEHICLE MANAGEMENT
   - Vehicle registry: VAN-042, MOTO-118, TRK-007, etc.
   - Tracks odometer reading (84,210 km)
   - Views last service date (12 Aug 2026)
   - Alerts for maintenance due:
     * MOTO-118: 2,890 km since service (orange alert)
     * VAN-031: In workshop for brake inspection (pink alert)
   - Can register new vehicle, update status
   ↓
4. nightly maintenance job runs
   - Run by an operations scheduler or administrator
   - Queries all GPS samples from yesterday
   - Calculates total distance per vehicle
   - Updates Vehicle.currentOdometer
   - Checks if maintenanceFlag needs to be set
   - Makes the summary available for fleet planning
   ↓
5. SETTLEMENTS: DRIVER PAYROLL
   - Current pay period: 26 Aug — 01 Sep 2026
   - Estimated payout: $28,460.40 (highlighted "Ready to approve")
   - Breakdown per driver:
     * Maya Chen: 184 deliveries, 1,420 km, $3,142.40
     * Arjun Rao: 167 deliveries, 1,188 km, $2,839.80
     * Dion Tan: 152 deliveries, 1,094 km, $2,588.20
     * Siti Rahman: 141 deliveries, 980 km, $2,391.40
   - Can export pay run as CSV/PDF for payroll processing
   - Approves payout → triggers payment processing
```

---

## Automated Workflows (n8n Integration)

The platform includes **3 pre-built n8n workflows** that automate critical operations:

### **1. Dispatch Order Workflow**
**Trigger:** Webhook POST to `/webhook/order-created`
**Payload:** 
```json
{
  "event": "order.created",
  "occurredAt": "2026-09-03T02:00:00Z",
  "order": {
    "id": "64-char-object-id",
    "trackingNumber": "RC-1001",
    "pickup": { "coordinates": [-73.99, 40.73] },
    "dropoff": { "coordinates": [-73.98, 40.74] },
    "recipient": { "phone": "+15551234567", "verificationPin": "4821" }
  }
}
```

**Steps:**
1. Receive order.created event from backend
2. Query `/api/v1/automation/drivers/nearby?latitude=40.735&longitude=-73.985&radiusMeters=5000`
3. Get idle drivers sorted by parcelCount, then distance
4. Select best-match driver
5. PATCH `/api/v1/orders/:orderId/assign` with driverId
6. If no driver available, escalate to Slack webhook

### **2. Nightly Maintenance Workflow**
**Trigger:** Scheduled (daily at 1 AM)

**Steps:**
1. Query all GPS locations captured in last 24 hours
2. Group by vehicle/driver
3. Calculate total distance traveled
4. Update Vehicle.currentOdometer
5. Check if distance since last service exceeds maintenanceIntervalKm
6. Set maintenanceFlag = true if needed
7. POST maintenance summary to ERP_MAINTENANCE_URL for fleet planning

### **3. Proximity Notification Workflow**
**Trigger:** Webhook POST to `/webhook/driver-near-dropoff`
**Payload:**
```json
{
  "driverId": "...",
  "distanceMeters": 250,
  "estimatedArrivalMinutes": 3,
  "dropoff": { "coordinates": [-73.98, 40.74] },
  "recipient": { "phone": "+15551234567", "verificationPin": "4821" }
}
```

**Steps:**
1. Receive and process the proximity event
2. Use the event for downstream delivery operations

---

## Technology Stack

### **Frontend (Web Portal)**
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite
- **Styling:** CSS custom properties (green/blue/lime theme)
- **Libraries:** 
  - React Router (navigation)
  - Lucide React (icons)
  - Papa Parse (CSV upload)
  - QR Code React (label generation)
- **State:** Context + fetch API (no Redux/Zustand currently)
- **Auth:** JWT tokens stored in localStorage

### **Mobile App (Driver App)**
- **Framework:** Flutter (Dart)
- **Platform:** iOS + Android native
- **Key packages:**
  - `dio`: HTTP client (for API calls)
  - `flutter_riverpod`: State management
  - `geolocator`: GPS tracking with background support
  - `mobile_scanner`: QR/barcode scanning
  - `image_picker`: Proof-of-delivery photo capture
  - `signature`: Signature capture (optional)
  - `shared_preferences`: Local token/data persistence
- **Theme:** Material 3 with teal color scheme (#0b5c58)

### **Backend API**
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **Database:** MongoDB (v4+)
  - Mongoose for ODM
  - 2dsphere indexes for geospatial queries
- **Auth:** JWT (HS256), role-based access control (RBAC)
- **Validation:** Zod schema validation
- **Error handling:** Custom AppError class with error codes
- **Database queries:** Geospatial queries for finding nearby drivers

### **Automation & Webhooks**
- **Automation Platform:** n8n (self-hosted or cloud)
- **Webhook authentication:** Shared secret (x-webhook-secret header)
- **External integrations:**
  - Slack (escalation alerts)
  - ERP system (maintenance results)

### **Infrastructure**
- **Deployment:** Docker (backend + n8n)
- **Database:** MongoDB Atlas (cloud) or self-hosted
- **Environment variables:** .env file (JWT_SECRET, MONGODB_URI, N8N_WEBHOOK_SECRET)

---

## Key Features & Capabilities

### **Merchant Portal**
✅ Create single orders or bulk import via CSV  
✅ Real-time order tracking with status badges  
✅ Search orders by tracking #, destination, city  
✅ Filter by status (All, In transit, Delivered)  
✅ Export order data for accounting/analysis  
✅ Generate QR-code shipping labels (thermal print ready)  
✅ View performance metrics (on-time %, active deliveries, exceptions, spend)  
✅ Historical delivery logs with timestamps  

### **Driver Mobile App**
✅ Manifest view (list of assigned deliveries)  
✅ Map integration (directions to pickup/dropoff)  
✅ Barcode scanning with validation  
✅ Proof-of-delivery photo capture  
✅ Real-time GPS tracking (background supported)  
✅ JWT authentication  
✅ Local offline access (via shared_preferences)  

### **Admin Operations**
✅ Merchant CRM (manage accounts, tier, volume)  
✅ Fleet management (vehicle registry, maintenance alerts)  
✅ Driver settlement payroll  
✅ Support ticket tracking  
✅ System-wide analytics  

### **Automation & Intelligence**
✅ Geospatial dispatch (find nearest idle drivers)  
✅ Load balancing (assign by parcel count)  
✅ Proximity SMS (notify customer when driver is near)  
✅ Nightly maintenance tracking  
✅ Proof-of-delivery validation  
✅ Barcode mismatch detection  

---

## Why This App Was Created

### Business Context
Last-mile delivery is the **most expensive and visible part** of e-commerce fulfillment. Current solutions are:
- **Too expensive** (3PL couriers charge $5-15 per delivery)
- **Too slow** (manual dispatch + poor driver coordination)
- **Too opaque** (merchants and customers can't track status)
- **Too fragmented** (separate systems for orders, drivers, fleet, payments)

### Routecraft's Value Proposition
1. **Merchants save 30-50% on delivery costs** through automated dispatch and load balancing
2. **Drivers earn 20-30% more** by eliminating idle time and optimizing routes
3. **Customers get real-time visibility** (SMS notifications, live tracking)
4. **Routecraft captures 5-15% of GMV** (Gross Merchandise Value) as platform fee

### Target Market
- **E-commerce:** Shopify stores, Amazon sellers, local retailers
- **Food delivery:** Restaurants, cloud kitchens (different from Uber Eats/DoorDash → B2B focus)
- **Logistics:** SME delivery companies trying to scale
- **On-demand:** Pharmacy delivery, grocery delivery, document courier
- **Geographic focus:** Southeast Asia (SG, MY, ID) based on demo data

---

## System Constraints & Guardrails

**Multi-tenancy:** Each merchant sees only their own orders via merchantId filtering  
**Role-based access:** Merchants can't access admin routes, drivers can't create orders  
**Barcode validation:** Prevents mis-scanned deliveries (tracking number must match order)  
**Geographic validation:** Order coordinates must be [-90, 90] latitude, [-180, 180] longitude  
**Order state machine:** Can't skip stages (pending → assigned → picked_up → in_transit → delivered)  
**Webhook security:** All automation calls require x-webhook-secret header  
**Load limits:** List operations capped at 100 results (prevents data dumps)  
**Geospatial queries:** Radius search limited to 1-100,000 meters

---

## Summary

**Routecraft** is a **modern, multi-user SaaS platform** that replaces manual, fragmented delivery operations with an automated, intelligent system. It connects three stakeholder groups (merchants, drivers, admins) around a single source of truth: orders. By combining real-time GPS tracking, intelligent dispatch, SMS notifications, and comprehensive dashboards, Routecraft solves the last-mile delivery problem and creates a better experience for every participant in the delivery ecosystem.

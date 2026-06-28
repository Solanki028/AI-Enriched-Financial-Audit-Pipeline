# AI-Enriched Financial Audit Pipeline

> If you want to understand the complete application flow visually, start here: [PROJECT_FLOW.md](./PROJECT_FLOW.md). It explains the user journey, backend internals, queue, worker, MongoDB collections, AI analysis pipeline, and frontend integration with diagrams.

Production-grade MERN project for an AI-Enriched Financial Audit Pipeline.

## Current Status

- Backend: complete and verified
- Frontend: complete for assessment flow and verified
- Queue: MongoDB-backed native queue, no Redis/BullMQ required
- Database: MongoDB or MongoDB Atlas
- Worker: separate Node.js process polling MongoDB queue
- Docker: optional, not required for local execution

## Prerequisites

Install these before running locally:

- Node.js 22 or newer
- npm 10 or newer
- MongoDB connection string. Local MongoDB or MongoDB Atlas both work.
- PowerShell, Git Bash, or any terminal that can run npm commands

## Project Structure

```text
AI-Enriched Financial Audit Pipeline/
+-- backend/              Node.js + Express + MongoDB API, worker, queue, analysis engine
+-- frontend/             React class-component frontend
+-- ARCHITECTURE.md       Frozen architecture document
+-- PROJECT_FLOW.md       Visual full-system flow document
+-- package.json          Root execution shortcuts
+-- README.md             This file
```

## Environment Configuration

Backend environment file:

```bash
copy backend\.env.example backend\.env
```

Frontend environment file:

```bash
copy frontend\.env.example frontend\.env
```

### Backend .env Parameters

| Variable                            | Purpose                     | Example                                      |
| ----------------------------------- | --------------------------- | -------------------------------------------- |
| NODE_ENV                            | Runtime mode                | development                                  |
| APP_HOST                            | API bind host               | 127.0.0.1                                    |
| APP_PORT                            | API port                    | 4000                                         |
| APP_JSON_LIMIT                      | Express JSON body limit     | 1mb                                          |
| CORS_ORIGINS                        | Allowed frontend origins    | http://127.0.0.1:5173,http://localhost:5173  |
| MONGODB_URI                         | MongoDB connection URI      | mongodb://127.0.0.1:27017                    |
| MONGODB_DB_NAME                     | Database name               | financial_audit                              |
| MONGODB_MIN_POOL_SIZE               | Mongo connection min pool   | 1                                            |
| MONGODB_MAX_POOL_SIZE               | Mongo connection max pool   | 20                                           |
| MONGODB_CONNECT_TIMEOUT_MS          | Mongo connect timeout       | 10000                                        |
| MONGODB_SERVER_SELECTION_TIMEOUT_MS | Server selection timeout    | 5000                                         |
| MONGODB_CONNECT_RETRY_ATTEMPTS      | Startup retry count         | 5                                            |
| MONGODB_CONNECT_RETRY_BASE_DELAY_MS | Retry base delay            | 500                                          |
| QUEUE_POLL_INTERVAL_MS              | Worker polling interval     | 500                                          |
| QUEUE_IDLE_BACKOFF_MAX_MS           | Worker idle backoff max     | 5000                                         |
| QUEUE_LEASE_DURATION_MS             | Job lease duration          | 30000                                        |
| QUEUE_MAX_ATTEMPTS                  | Job retry attempt limit     | 3                                            |
| QUEUE_RETRY_BASE_DELAY_MS           | Retry backoff base delay    | 1000                                         |
| PROCESSING_MODEL_DELAY_MS           | Simulated processing delay  | 400                                          |
| PROCESSING_WORKER_CONCURRENCY       | Worker parallelism          | 4                                            |
| PROCESSING_MIGRATION_BATCH_SIZE     | Migration batch size config | 100                                          |
| PROCESSING_QUEUE_BACKPRESSURE_LIMIT | Queue pressure threshold    | 1000                                         |
| LOG_LEVEL                           | Logger level                | info                                         |
| LOG_SERVICE_NAME                    | Service name in logs        | financial-audit-backend                      |
| LOG_REDACT_PATHS                    | Sensitive log paths         | req.headers.authorization,req.headers.cookie |

### Frontend .env Parameters

| Variable          | Purpose              | Example               |
| ----------------- | -------------------- | --------------------- |
| VITE_API_BASE_URL | Backend API base URL | http://127.0.0.1:4000 |

## Install Dependencies

From the project root:

```bash
npm run install:all
```

Or separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Seed the Database

The project includes a seed command that creates mock journal entries and queues analysis jobs.

From the project root:

```bash
npm run seed
```

Equivalent backend command:

```bash
cd backend
npm run seed
```

Important: seeding creates entries and queues analysis jobs. Start the worker to process those queued jobs.

## Run the Services Locally

Use three terminals so the API, worker, and client run simultaneously.

### Terminal 1 - API Server

```bash
npm run start:server
```

Equivalent:

```bash
cd backend
npm run start:server
```

API runs on the port configured by APP_PORT. Default recommended local URL:

```text
http://127.0.0.1:4000
```

### Terminal 2 - Worker Process

```bash
npm run start:worker
```

Equivalent:

```bash
cd backend
npm run start:worker
```

The worker polls MongoDB collection processing_jobs and executes queued analysis jobs.

### Terminal 3 - Frontend Client

```bash
npm run start:client
```

Equivalent:

```bash
cd frontend
npm run dev
```

Frontend default URL:

```text
http://127.0.0.1:5173
```

## Day 3 Batch Model Migration Trigger

You can trigger model migration in two supported ways.

### Option A - CLI Command

From the project root:

```bash
npm run migrate:models
```

Equivalent backend command:

```bash
cd backend
npm run migrate:models
```

This queues model_migration jobs for all migration candidates. The worker processes them asynchronously.

### Option B - API Endpoint

PowerShell example:

```powershell
$body = @{
  scope = 'all'
  targetVersions = @{
    risk = 'v1.1'
    anomaly = 'v1.1'
    compliance = 'v1.1'
    semanticVector = 'v1.1'
    financialVector = 'v1.1'
    entityVector = 'v1.1'
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri http://127.0.0.1:4000/api/admin/model-migrations -Method Post -Body $body -ContentType 'application/json'
```

curl example:

```bash
curl -X POST http://127.0.0.1:4000/api/admin/model-migrations \
  -H "Content-Type: application/json" \
  -d '{"scope":"all","targetVersions":{"risk":"v1.1","anomaly":"v1.1","compliance":"v1.1","semanticVector":"v1.1","financialVector":"v1.1","entityVector":"v1.1"}}'
```

## Regulatory Shifts / Partial Recalculation Trigger (Scenario D)

When compliance rules or thresholds shift, you can trigger partial risk recalculation (leaving vector attributes untouched) in two ways.

### Option A - CLI Command

From the project root:

```bash
npm run recalculate:rules
```

Equivalent backend command:

```bash
cd backend
npm run recalculate:rules
```

This queues partial_risk jobs for all entries. The worker processes them asynchronously without re-generating vectors.

### Option B - API Endpoint

PowerShell example:

```powershell
$body = @{
  scope = 'all'
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:4000/api/admin/risk-recalculations -Method Post -Body $body -ContentType 'application/json'
```

curl example:

```bash
curl -X POST http://127.0.0.1:4000/api/admin/risk-recalculations \
  -H "Content-Type: application/json" \
  -d '{"scope":"all"}'
```

## Health and Verification Commands

### API Health

```bash
curl http://127.0.0.1:4000/health
```

PowerShell:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:4000/health -Method Get
```

### Backend Quality Gate

```bash
npm run check:backend
```

### Frontend Quality Gate

```bash
npm run check:frontend
```

### Full Quality Gate

```bash
npm run check
```

Note: Vite/esbuild may need permission to spawn its local build binary on restricted Windows sandboxes.

## Main API Endpoints

| Method | Endpoint                       | Purpose                                                    |
| ------ | ------------------------------ | ---------------------------------------------------------- |
| GET    | /health                        | API and database health                                    |
| GET    | /api/docs/openapi.json         | OpenAPI JSON                                               |
| POST   | /api/entries                   | Create journal entry and queue full analysis               |
| GET    | /api/entries                   | Dashboard list with filtering, sorting, pagination         |
| GET    | /api/entries/:id               | Entry detail with latest analysis and job status           |
| PUT    | /api/entries/:id               | Update entry with revision-aware processing                |
| POST   | /api/entries/search/similar    | Similarity search by semantic, financial, or entity vector |
| POST   | /api/admin/model-migrations    | Queue model migration jobs                                 |
| POST   | /api/admin/risk-recalculations | Queue partial risk recalculation jobs                      |
| GET    | /api/admin/queue/status        | Queue status and metrics                                   |
| GET    | /api/admin/workers/status      | Worker status view                                         |
| GET    | /api/audit/events              | Audit event list                                           |

## Quick Demo Flow

1. Configure backend and frontend environment files.
2. Install dependencies.
3. Start server.
4. Start worker.
5. Seed database.
6. Start frontend.
7. Open the frontend dashboard.
8. Select an entry.
9. Review risk, severity, anomalies, compliance, vectors, and processing status.
10. Update an entry and observe revision-aware reprocessing.
11. Trigger migration from Admin page or npm run migrate:models.

## Security Note

Do not commit real credentials. Local .env files are ignored by Git. If credentials were shared in chat or screenshots, rotate the MongoDB Atlas password.

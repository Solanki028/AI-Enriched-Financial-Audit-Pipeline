# AI-Enriched Financial Audit Pipeline - Backend Foundation

Production-oriented Node.js and Express foundation for the financial audit pipeline.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- MongoDB

## Setup

```bash
npm install
copy .env.example .env
npm run start:server
```

Update `.env` before startup when MongoDB is not available at the example address.

## Commands

```bash
npm run start:server
npm run start:worker
npm run dev:server
npm run dev:worker
npm run lint
npm run format:check
npm test
npm run check
```

The worker bootstrap currently initializes only the approved foundation infrastructure. Queue consumers
and job processors are intentionally outside this implementation phase.

## Health Check

```http
GET /health
```

The endpoint reports server status, MongoDB connection status, application version, and uptime.

## Current Scope

Implemented:

- Environment and typed configuration
- Dependency container
- Express security and transport middleware
- Structured request and lifecycle logging
- MongoDB connection lifecycle and initial retry strategy
- API, worker, and script bootstraps
- Central 404 and error handling
- Health endpoint

Business routes, controllers, models, repositories, queues, workers, and analysis engines are not included.

# Project Flow - AI-Enriched Financial Audit Pipeline

This document explains the complete application flow visually and textually. Use this when you want to understand how a user action moves through the React frontend, Express API, MongoDB repositories, MongoDB queue, worker process, and deterministic AI analysis engine.

## 1. Full System Overview

```mermaid
flowchart LR
  User[User / Auditor] --> Frontend[React Frontend]
  Frontend --> Api[Express API Server]
  Api --> Services[Application Services]
  Services --> Repositories[Mongo Repositories]
  Services --> JobQueue[MongoDB Queue]
  Repositories --> Mongo[(MongoDB)]
  JobQueue --> Mongo
  Worker[Worker Process] --> JobQueue
  Worker --> Intelligence[Analysis Engine]
  Intelligence --> Worker
  Worker --> Repositories
  Repositories --> Mongo
  Mongo --> Api
  Api --> Frontend
```

Core idea:

- The API responds quickly.
- Long-running analysis is never executed inside the HTTP request.
- The API writes a job into MongoDB.
- The worker process picks that job and runs analysis asynchronously.
- The frontend reads the latest entry, analysis, and processing state.

## 2. Runtime Processes

The project runs as three local processes.

```mermaid
flowchart TB
  subgraph Terminal1[Terminal 1]
    ServerCmd[npm run start:server] --> ApiProcess[API Process]
  end

  subgraph Terminal2[Terminal 2]
    WorkerCmd[npm run start:worker] --> WorkerProcess[Worker Process]
  end

  subgraph Terminal3[Terminal 3]
    ClientCmd[npm run start:client] --> ClientProcess[Vite React Frontend]
  end

  ApiProcess --> Mongo[(MongoDB Atlas or Local MongoDB)]
  WorkerProcess --> Mongo
  ClientProcess --> ApiProcess
```

No Redis is required. No BullMQ is required. No Docker is required for local execution.

## 3. Frontend Flow

```mermaid
flowchart TD
  App[App.jsx] --> Header[AppHeader]
  App --> Pages{Active Page}
  Pages --> Dashboard[DashboardPage]
  Pages --> Create[CreateEntryPage]
  Pages --> Similarity[SimilarityPage]
  Pages --> Admin[AdminPage]
  Pages --> Audit[AuditPage]

  Dashboard --> EntryTable[EntryTable]
  Dashboard --> EntryDetail[EntryDetail]
  Dashboard --> EntryUpdateForm[EntryUpdateForm]
  Dashboard --> AnalysisPanel[AnalysisDetailPanel]

  Create --> EntryForm[EntryForm]
  Similarity --> SimilarityPanel[SimilarityPanel]
  Admin --> AdminPanel[AdminPanel]
```

Frontend rules:

- React class components only.
- No hooks.
- API calls go through service classes.
- UI components do not know fetch details.

## 4. Frontend Service Layer

```mermaid
flowchart LR
  Components[React Class Components] --> Services[Frontend Service Classes]
  Services --> ApiClient[ApiClient]
  ApiClient --> Backend[Express API]

  Services --> EntryService[EntryService]
  Services --> SimilarityService[SimilarityService]
  Services --> AdminService[AdminService]
  Services --> AuditService[AuditService]
```

Why this matters:

- Components remain focused on rendering and state.
- API paths and HTTP behavior stay centralized.
- Future auth headers or request tracing can be added in ApiClient only.

## 5. Backend Layering

```mermaid
flowchart TD
  Router[Express Router] --> Controller[Controller]
  Controller --> Validator[Request Validator]
  Validator --> Service[Application Service]
  Service --> Repository[Repository]
  Service --> JobService[JobService]
  JobService --> Queue[MongoJobQueue]
  Repository --> Mongo[(MongoDB)]
  Queue --> Mongo
```

Layer responsibilities:

| Layer        | Responsibility                                        |
| ------------ | ----------------------------------------------------- |
| Controller   | Validate transport request and return response        |
| Service      | Business orchestration                                |
| Repository   | MongoDB persistence only                              |
| Queue        | Durable job state                                     |
| Worker       | Background execution                                  |
| Intelligence | Deterministic risk/anomaly/compliance/vector analysis |

## 6. Create Entry Flow

User creates a journal entry from the frontend.

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant API
  participant EntryService
  participant EntryRepo
  participant AuditRepo
  participant Queue
  participant Worker
  participant AnalysisRepo

  User->>Frontend: Submit Create Entry form
  Frontend->>API: POST /api/entries
  API->>EntryService: createEntry
  EntryService->>EntryRepo: Insert journal entry revision 1
  EntryService->>AuditRepo: Insert audit event
  EntryService->>Queue: Enqueue full_analysis job
  API-->>Frontend: 202 entryId + queued status
  Worker->>Queue: Claim job
  Worker->>EntryRepo: Load current entry
  Worker->>Worker: Verify sourceRevision
  Worker->>Worker: Run analysis pipeline
  Worker->>AnalysisRepo: Save analysis if revision matches
  Worker->>Queue: Mark job completed
```

Important behavior:

- API returns immediately after job creation.
- Worker handles analysis later.
- The dashboard shows processing status while the job runs.

## 7. Update Entry Flow

```mermaid
flowchart TD
  Start[User updates entry] --> Api[PUT /api/entries/:id]
  Api --> Load[Load current entry]
  Load --> Detect[Detect changed fields]
  Detect --> Decision{Change type?}

  Decision -->|Core financial fields| Full[Full analysis required]
  Decision -->|Partial risk fields| Partial[Partial risk required]
  Decision -->|Metadata only| Metadata[Metadata-only update]

  Full --> Rev[Increment sourceRevision]
  Partial --> Rev
  Rev --> Stale[Mark older analysis stale]
  Stale --> Job[Create queue job]
  Job --> Return[Return immediately]

  Metadata --> Atomic[Atomic metadata update]
  Atomic --> NoRev[No revision increment]
  NoRev --> NoJob[No job]
  NoJob --> Return
```

Decision summary:

| Update Type           | Revision Increment | Queue Job | Reason                     |
| --------------------- | -----------------: | --------: | -------------------------- |
| Core financial change |                Yes |       Yes | Analysis can change        |
| Partial risk change   |                Yes |       Yes | Risk/compliance can change |
| Metadata only         |                 No |        No | Analysis does not change   |
| No change             |                 No |        No | Nothing to process         |

## 8. Queue and Worker Flow

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> processing: worker claims job
  queued --> processing: retry available
  processing --> completed: success
  processing --> queued: transient failure retry
  processing --> failed: permanent failure or max attempts
  processing --> stale: source revision mismatch
  pending --> stale: superseded by newer revision
  queued --> stale: superseded by newer revision
  pending --> cancelled
  queued --> cancelled
```

Queue collection:

```text
processing_jobs
```

Worker guarantees:

- Atomic job claim.
- Lease ownership.
- Lease renewal during work.
- Retry with backoff.
- Stale protection when newer revisions exist.
- No old job can overwrite newer analysis.

## 9. Analysis Pipeline

```mermaid
flowchart TD
  Entry[Journal Entry] --> Normalize[Entry Normalizer]
  Normalize --> Semantic[Semantic Vector Generator]
  Semantic --> Financial[Financial Vector Generator]
  Financial --> Entity[Entity Vector Generator]
  Entity --> Anomaly[Anomaly Detector]
  Anomaly --> Risk[Risk Calculator]
  Risk --> Severity[Severity Classifier]
  Severity --> Compliance[Compliance Evaluator]
  Compliance --> Versioning[Model and Context Versioning]
  Versioning --> Result[Immutable AnalysisResult]
```

Analysis output:

- riskScore
- severity
- triggeredRules
- anomalies
- compliance result
- semantic vector
- financial vector
- entity vector
- model versions
- context version

The assessment version does not call OpenAI and does not use ML embeddings. Vectors are deterministic mock vectors derived from source data.

## 10. Revision Protection

```mermaid
sequenceDiagram
  participant Worker
  participant EntryRepo
  participant AnalysisRepo

  Worker->>EntryRepo: Load entry by entryId
  EntryRepo-->>Worker: entry with current sourceRevision
  Worker->>Worker: Compare job.sourceRevision with entry.sourceRevision

  alt revisions match
    Worker->>AnalysisRepo: Save analysis
    AnalysisRepo-->>Worker: persisted
  else revisions do not match
    Worker->>Worker: Skip persistence
    Worker->>Worker: Mark job stale
  end
```

Why this exists:

If a user updates an entry while an older job is still processing, the older job must not overwrite the newer result.

## 11. Database Collections

```mermaid
erDiagram
  JOURNAL_ENTRIES ||--o{ ENTRY_ANALYSES : has
  JOURNAL_ENTRIES ||--o{ PROCESSING_JOBS : queues
  JOURNAL_ENTRIES ||--o{ AUDIT_EVENTS : records

  JOURNAL_ENTRIES {
    string entryId
    number sourceRevision
    string processingStatus
    string companyId
    string currency
    number debit
    number credit
    number amount
    number riskScore
    string severity
  }

  ENTRY_ANALYSES {
    string entryId
    number sourceRevision
    number riskScore
    string severity
    array semanticVector
    array financialVector
    array entityVector
    boolean stale
  }

  PROCESSING_JOBS {
    string jobId
    string jobType
    string entryId
    number sourceRevision
    string status
    number attemptCount
    date leaseExpiresAt
  }

  AUDIT_EVENTS {
    string auditEventId
    string entryId
    string action
    string actorId
    string correlationId
  }
```

This is a conceptual map of the MongoDB collections used by the application.

## 12. Dashboard Read Flow

```mermaid
sequenceDiagram
  participant Frontend
  participant API
  participant EntryService
  participant EntryRepo

  Frontend->>API: GET /api/entries?page=1&pageSize=25&sortBy=createdAt
  API->>EntryService: listEntries
  EntryService->>EntryRepo: findDashboard with projection
  EntryRepo-->>EntryService: dashboard rows without vectors
  EntryService-->>API: paginated response
  API-->>Frontend: rows + total
```

Dashboard intentionally excludes vectors because vectors are large and not needed in list views.

## 13. Entry Detail Read Flow

```mermaid
sequenceDiagram
  participant Frontend
  participant API
  participant EntryService
  participant EntryRepo
  participant AnalysisRepo
  participant JobRepo

  Frontend->>API: GET /api/entries/:id
  API->>EntryService: getEntry
  EntryService->>EntryRepo: find entry
  EntryService->>AnalysisRepo: find latest analysis
  EntryService->>JobRepo: find latest processing job
  API-->>Frontend: entry + analysis + processing status
```

The frontend uses this response to render:

- journal entry summary
- update form
- risk summary
- anomalies
- compliance
- vector summary
- processing state

## 14. Similarity Search Flow

```mermaid
sequenceDiagram
  participant Frontend
  participant API
  participant SimilarityService
  participant AnalysisRepo

  Frontend->>API: POST /api/entries/search/similar
  API->>SimilarityService: searchSimilar(entryId, strategy)
  SimilarityService->>AnalysisRepo: find source analysis
  SimilarityService->>SimilarityService: select semantic, financial, or entity vector
  SimilarityService->>AnalysisRepo: compute top 5 similar analyses
  API-->>Frontend: similarity results
```

Supported strategies:

- semantic
- financial
- entity

## 15. Admin and Migration Flow

```mermaid
flowchart TD
  Admin[Admin Page or CLI] --> Trigger{Trigger type}
  Trigger --> Migration[Model Migration]
  Trigger --> Recalc[Partial Risk Recalculation]

  Migration --> AdminService[AdministrationService]
  Recalc --> AdminService
  AdminService --> EntryRepo[Resolve target entries]
  EntryRepo --> JobService[JobService]
  JobService --> Queue[processing_jobs]
  Queue --> Worker[Worker Process]
  Worker --> Analysis[Analysis Engine]
  Analysis --> Mongo[(MongoDB)]
```

Migration does not run synchronously. It only queues jobs. The worker executes them.

CLI trigger:

```bash
npm run migrate:models
```

API trigger:

```http
POST /api/admin/model-migrations
```

## 16. Seed Flow

```mermaid
sequenceDiagram
  participant CLI
  participant SeedScript
  participant EntryService
  participant EntryRepo
  participant AuditRepo
  participant Queue
  participant Worker

  CLI->>SeedScript: npm run seed
  SeedScript->>EntryService: create mock entries
  EntryService->>EntryRepo: persist entries
  EntryService->>AuditRepo: persist audit events
  EntryService->>Queue: enqueue full_analysis jobs
  Worker->>Queue: process jobs when running
```

Seed command:

```bash
npm run seed
```

## 17. Local Execution Timeline

```mermaid
sequenceDiagram
  participant Dev
  participant API
  participant Worker
  participant Client
  participant Mongo

  Dev->>API: npm run start:server
  API->>Mongo: connect + ensure indexes
  Dev->>Worker: npm run start:worker
  Worker->>Mongo: connect + poll queue
  Dev->>Client: npm run start:client
  Client->>API: browser/API requests
  API->>Mongo: persist and enqueue
  Worker->>Mongo: claim and process jobs
  Client->>API: read updated analysis
```

## 18. Error Handling Flow

```mermaid
flowchart TD
  Error[Thrown error] --> Handler[Central ErrorHandler]
  Handler --> Known{ApplicationError?}
  Known -->|Yes| Operational[Use statusCode and errorCode]
  Known -->|No| Internal[Return 500]
  Operational --> Response[JSON error response]
  Internal --> Response
```

Error response includes:

- requestId
- timestamp
- errorCode
- message
- details when safe

## 19. Complete User Journey

```mermaid
flowchart TD
  Start[Auditor opens frontend] --> Dashboard[Dashboard loads entries]
  Dashboard --> Create[Create journal entry]
  Create --> Queued[Entry saved and analysis queued]
  Queued --> Worker[Worker processes analysis]
  Worker --> Review[Auditor reviews risk and compliance]
  Review --> Update[Auditor updates entry]
  Update --> Revision[Revision increments if financial fields changed]
  Revision --> Reprocess[New analysis job runs]
  Review --> Similarity[Auditor searches similar entries]
  Review --> Admin[Admin triggers migration or recalculation]
  Admin --> Jobs[Jobs queued]
  Jobs --> Worker
```

## 20. Final Mental Model

Think of the system as four cooperating parts:

```text
Frontend = user workflow and visualization
API = validation and orchestration
MongoDB = durable state and queue storage
Worker = asynchronous analysis execution
```

The key production safety mechanism is sourceRevision. It ensures derived analysis never overwrites a newer version of a journal entry.

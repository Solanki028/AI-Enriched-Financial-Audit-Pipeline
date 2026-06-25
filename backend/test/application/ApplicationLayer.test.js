import assert from 'node:assert/strict';
import test from 'node:test';

import request from 'supertest';

import { Application } from '../../src/app/Application.js';
import { ApiRouterFactory } from '../../src/app/routes/ApiRouterFactory.js';
import { AdministrationService } from '../../src/modules/administration/services/AdministrationService.js';
import { AuditService } from '../../src/modules/audit/services/AuditService.js';
import { EntryService } from '../../src/modules/entries/services/EntryService.js';
import { JobService } from '../../src/modules/jobs/services/JobService.js';
import { SimilarityService } from '../../src/modules/similarity/services/SimilarityService.js';

class NullLogger {
  child() {
    return this;
  }

  error() {}

  info() {}

  warn() {}
}

class FakeEntryRepository {
  constructor() {
    this.entries = new Map();
    this.nextId = 1;
  }

  async create(entry) {
    const entryId = 'entry-' + this.nextId;
    this.nextId += 1;
    const created = { ...entry, entryId };
    this.entries.set(entryId, created);
    return created;
  }

  async findById(entryId) {
    return this.entries.get(entryId) ?? null;
  }

  async findManyByIds(entryIds) {
    return entryIds.map((entryId) => this.entries.get(entryId)).filter(Boolean);
  }

  async findMigrationCandidates() {
    return Array.from(this.entries.values());
  }

  async findDashboard({ page, pageSize }) {
    const items = Array.from(this.entries.values()).map((entry) => ({
      ...entry,
      riskScore: 0.4,
      severity: 'MEDIUM',
    }));

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: items.length,
    };
  }

  async updateMetadata(entryId, changes) {
    const existing = this.entries.get(entryId);
    const updated = { ...existing, ...changes };
    this.entries.set(entryId, updated);
    return updated;
  }

  async updateWithRevision(entryId, changes, { expectedRevision, processingStatus }) {
    const existing = this.entries.get(entryId);
    if (!existing || existing.sourceRevision !== expectedRevision) {
      return null;
    }

    const updated = {
      ...existing,
      ...changes,
      processingStatus,
      sourceRevision: existing.sourceRevision + 1,
    };
    this.entries.set(entryId, updated);
    return updated;
  }
}

class FakeAnalysisRepository {
  constructor() {
    this.analyses = new Map();
    this.staleCalls = [];
  }

  async findLatestByEntryId(entryId) {
    return this.analyses.get(entryId) ?? null;
  }

  async markStale(entryId, sourceRevision) {
    this.staleCalls.push({ entryId, sourceRevision });
  }

  async searchSimilar() {
    return [
      {
        entry: { description: 'Similar entry' },
        entryId: 'entry-2',
        similarityScore: 0.91,
      },
    ];
  }
}

class FakeAuditRepository {
  constructor() {
    this.events = [];
  }

  async create(event) {
    this.events.push(event);
    return event;
  }

  async find() {
    return this.events;
  }
}

class FakeJobQueue {
  constructor() {
    this.jobs = [];
  }

  async enqueue(command) {
    const job = { ...command, jobId: 'job-' + (this.jobs.length + 1), status: 'pending' };
    this.jobs.push(job);
    return { created: true, job };
  }

  async getDepth() {
    return this.jobs.length;
  }
}

class FakeJobRepository {
  constructor(queue) {
    this.queue = queue;
  }

  async findLatestByEntryId(entryId) {
    return this.queue.jobs.findLast((job) => job.entryId === entryId) ?? null;
  }
}

function createHarness() {
  const entryRepository = new FakeEntryRepository();
  const analysisRepository = new FakeAnalysisRepository();
  const auditRepository = new FakeAuditRepository();
  const jobQueue = new FakeJobQueue();
  const auditService = new AuditService({ auditRepository });
  const jobService = new JobService({ jobQueue, jobRepository: new FakeJobRepository(jobQueue) });
  const entryService = new EntryService({
    analysisRepository,
    auditService,
    entryRepository,
    jobService,
  });
  const similarityService = new SimilarityService({ analysisRepository });
  const administrationService = new AdministrationService({ entryRepository, jobService });
  const router = new ApiRouterFactory({
    administrationService,
    auditService,
    entryService,
    similarityService,
  }).createRouter();
  const application = new Application({
    apiRouter: router,
    applicationConfig: {
      corsOrigins: ['*'],
      environment: 'test',
      jsonLimit: '1mb',
    },
    healthMonitor: {
      handle(_request, response) {
        response.status(200).json({ status: 'ok' });
      },
    },
    logger: new NullLogger(),
    openApiSpec: { openapi: '3.1.0' },
  });

  return { analysisRepository, application, auditRepository, entryRepository, jobQueue };
}

function validEntry() {
  return {
    accountId: 'cash',
    companyId: 'company-1',
    credit: 0,
    currency: 'USD',
    debit: 100,
    description: 'Office supplies',
    transactionDate: '2026-01-01',
  };
}

test('POST /api/entries persists entry, audits event, queues full analysis, and returns immediately', async () => {
  const { application, auditRepository, jobQueue } = createHarness();

  const response = await request(application.handler)
    .post('/api/entries')
    .send(validEntry())
    .expect(202);

  assert.equal(response.body.data.entryId, 'entry-1');
  assert.equal(response.body.data.processingStatus, 'queued');
  assert.equal(response.body.data.sourceRevision, 1);
  assert.equal(auditRepository.events[0].action, 'entry_created');
  assert.equal(jobQueue.jobs[0].jobType, 'full_analysis');
});

test('PUT /api/entries/:id metadata-only update does not increment revision or enqueue a job', async () => {
  const { application, jobQueue } = createHarness();
  const created = await request(application.handler)
    .post('/api/entries')
    .send(validEntry())
    .expect(202);

  const response = await request(application.handler)
    .put('/api/entries/' + created.body.data.entryId)
    .send({ notes: 'Reviewed by finance' })
    .expect(200);

  assert.equal(response.body.data.updateType, 'metadata_only');
  assert.equal(response.body.data.sourceRevision, 1);
  assert.equal(jobQueue.jobs.length, 1);
});

test('PUT /api/entries/:id financial update increments revision, stales analysis, and queues full analysis', async () => {
  const { analysisRepository, application, jobQueue } = createHarness();
  const created = await request(application.handler)
    .post('/api/entries')
    .send(validEntry())
    .expect(202);

  const response = await request(application.handler)
    .put('/api/entries/' + created.body.data.entryId)
    .send({ debit: 250 })
    .expect(200);

  assert.equal(response.body.data.updateType, 'full_analysis_required');
  assert.equal(response.body.data.sourceRevision, 2);
  assert.equal(analysisRepository.staleCalls.length, 1);
  assert.equal(jobQueue.jobs.at(-1).jobType, 'full_analysis');
});

test('GET /api/entries returns entry, latest analysis, processing status and current revision', async () => {
  const { analysisRepository, application } = createHarness();
  const created = await request(application.handler)
    .post('/api/entries')
    .send(validEntry())
    .expect(202);
  analysisRepository.analyses.set(created.body.data.entryId, {
    riskScore: 0.7,
    semanticVector: [0.1],
  });

  const response = await request(application.handler)
    .get('/api/entries/' + created.body.data.entryId)
    .expect(200);

  assert.equal(response.body.data.entry.entryId, created.body.data.entryId);
  assert.equal(response.body.data.analysis.riskScore, 0.7);
  assert.equal(response.body.data.processingStatus.status, 'pending');
  assert.equal(response.body.data.sourceRevision, 1);
});

test('GET /api/entries returns dashboard projection without vectors', async () => {
  const { application } = createHarness();
  await request(application.handler).post('/api/entries').send(validEntry()).expect(202);

  const response = await request(application.handler)
    .get('/api/entries?page=1&pageSize=10')
    .expect(200);

  assert.equal(response.body.data.items.length, 1);
  assert.equal(response.body.data.items[0].semanticVector, undefined);
});

test('POST /api/entries/search/similar selects requested vector strategy and returns top results', async () => {
  const { analysisRepository, application } = createHarness();
  const created = await request(application.handler)
    .post('/api/entries')
    .send(validEntry())
    .expect(202);
  analysisRepository.analyses.set(created.body.data.entryId, {
    entityVector: [0.1],
    financialVector: [0.2],
    semanticVector: [0.3],
  });

  const response = await request(application.handler)
    .post('/api/entries/search/similar')
    .send({ entryId: created.body.data.entryId, strategy: 'semantic' })
    .expect(200);

  assert.equal(response.body.data.results.length, 1);
  assert.equal(response.body.data.results[0].similarityScore, 0.91);
});

test('validation errors use production API error response shape', async () => {
  const { application } = createHarness();

  const response = await request(application.handler).post('/api/entries').send({}).expect(400);

  assert.equal(response.body.error.errorCode, 'REQUEST_VALIDATION_FAILED');
  assert.equal(typeof response.body.error.requestId, 'string');
  assert.equal(typeof response.body.error.timestamp, 'string');
});

test('administration endpoints enqueue worker jobs instead of executing synchronously', async () => {
  const { application, jobQueue } = createHarness();
  const created = await request(application.handler)
    .post('/api/entries')
    .send(validEntry())
    .expect(202);

  const response = await request(application.handler)
    .post('/api/admin/risk-recalculations')
    .send({ entryIds: [created.body.data.entryId] })
    .expect(202);

  assert.equal(response.body.data.enqueued, 1);
  assert.equal(jobQueue.jobs.at(-1).jobType, 'partial_risk');
});

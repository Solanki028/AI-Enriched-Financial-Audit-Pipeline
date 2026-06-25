import { MongoJobQueue } from '../../src/infrastructure/queue/MongoJobQueue.js';
import { JobLeaseManager } from '../../src/infrastructure/queue/JobLeaseManager.js';
import { ProcessingMetrics } from '../../src/infrastructure/monitoring/ProcessingMetrics.js';
import { JobRetryPolicy } from '../../src/modules/jobs/policies/JobRetryPolicy.js';
import { JobType } from '../../src/modules/jobs/policies/JobType.js';
import { JobErrorSerializer } from '../../src/modules/jobs/services/JobErrorSerializer.js';
import { ProcessingJobFactory } from '../../src/modules/jobs/services/ProcessingJobFactory.js';
import { JobProcessorRegistry } from '../../src/workers/JobProcessorRegistry.js';
import { WorkerApplication } from '../../src/workers/WorkerApplication.js';
import { WorkerRunner } from '../../src/workers/WorkerRunner.js';
import { FakeMongoCollection } from './FakeMongoCollection.js';

export class NullLogger {
  child() {
    return this;
  }

  info() {
    return undefined;
  }

  warn() {
    return undefined;
  }

  error() {
    return undefined;
  }
}

export class ManualClock {
  constructor(now = new Date('2026-06-25T00:00:00.000Z')) {
    this.current = now;
  }

  now() {
    return new Date(this.current.getTime());
  }

  advance(milliseconds) {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}

export class StaticProcessor {
  constructor({
    delayMs = 0,
    jobType = JobType.FULL_ANALYSIS,
    result = { status: 'completed' },
  } = {}) {
    this.jobType = jobType;
    this.delayMs = delayMs;
    this.result = result;
    this.processedJobIds = [];
  }

  async process(job) {
    this.processedJobIds.push(job.jobId);

    if (this.delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, this.delayMs);
      });
    }

    return this.result;
  }
}

export class FailingProcessor {
  constructor({ failuresBeforeSuccess = 1, jobType = JobType.FULL_ANALYSIS }) {
    this.jobType = jobType;
    this.failuresBeforeSuccess = failuresBeforeSuccess;
    this.calls = 0;
  }

  async process() {
    this.calls += 1;

    if (this.calls <= this.failuresBeforeSuccess) {
      throw Object.assign(new Error('Transient test failure.'), { isTransient: true });
    }

    return { status: 'completed' };
  }
}

export class WorkerTestHarness {
  static createQueue({ clock = new ManualClock(), leaseDurationMs = 1000 } = {}) {
    const collection = new FakeMongoCollection();
    const queue = new MongoJobQueue({
      collection,
      errorSerializer: new JobErrorSerializer(),
      jobFactory: new ProcessingJobFactory({
        defaultMaxAttempts: 3,
        idGenerator: () => `job-${collection.documents.length + 1}`,
        now: () => clock.now(),
      }),
      leaseDurationMs,
      now: () => clock.now(),
      retryPolicy: new JobRetryPolicy({ baseDelayMs: 100 }),
    });

    return { clock, collection, queue };
  }

  static createWorker({ concurrency = 1, processor, queue, workerId = 'worker-1' }) {
    const metrics = new ProcessingMetrics();
    const runner = new WorkerRunner({
      concurrency,
      idleBackoffMaxMs: 10,
      jobLeaseManager: new JobLeaseManager({
        queue,
        renewalIntervalMs: 5,
        workerId,
      }),
      logger: new NullLogger(),
      metrics,
      pollIntervalMs: 5,
      processorRegistry: new JobProcessorRegistry([processor]),
      queue,
      workerId,
    });

    return new WorkerApplication({
      logger: new NullLogger(),
      metrics,
      queue,
      runner,
    });
  }

  static fullAnalysisCommand(overrides = {}) {
    return {
      correlationId: 'correlation-1',
      entryId: 'entry-1',
      jobType: JobType.FULL_ANALYSIS,
      priority: 0,
      sourceRevision: 1,
      ...overrides,
    };
  }

  static async waitFor(predicate, timeoutMs = 1000) {
    const startedAt = performance.now();

    while (performance.now() - startedAt < timeoutMs) {
      if (await predicate()) {
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
    }

    throw new Error('Timed out waiting for condition.');
  }
}

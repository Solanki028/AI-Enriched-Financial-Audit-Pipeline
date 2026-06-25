import assert from 'node:assert/strict';
import test from 'node:test';

import { JobStatus } from '../../src/modules/jobs/policies/JobStatus.js';
import { JobType } from '../../src/modules/jobs/policies/JobType.js';
import { JobProcessorRegistry } from '../../src/workers/JobProcessorRegistry.js';
import { StaticProcessor, WorkerTestHarness } from '../helpers/WorkerTestHarness.js';

test('WorkerApplication processes a queued job successfully', async () => {
  const { collection, queue } = WorkerTestHarness.createQueue();
  const processor = new StaticProcessor();
  const worker = WorkerTestHarness.createWorker({ processor, queue });

  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());
  await worker.start();
  await WorkerTestHarness.waitFor(
    () => collection.allDocuments()[0]?.status === JobStatus.COMPLETED,
  );
  await worker.stop();

  assert.equal(processor.processedJobIds.length, 1);
  assert.equal((await worker.getMetrics()).completedJobs, 1);
});

test('WorkerApplication gracefully stops while idle', async () => {
  const { queue } = WorkerTestHarness.createQueue();
  const worker = WorkerTestHarness.createWorker({
    processor: new StaticProcessor(),
    queue,
  });

  await worker.start();
  await worker.stop();

  assert.equal((await worker.getMetrics()).queueDepth, 0);
});

test('WorkerRunner does not process the same job twice with concurrent slots', async () => {
  const { collection, queue } = WorkerTestHarness.createQueue();
  const processor = new StaticProcessor({ delayMs: 20 });
  const worker = WorkerTestHarness.createWorker({
    concurrency: 4,
    processor,
    queue,
  });

  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());
  await worker.start();
  await WorkerTestHarness.waitFor(
    () => collection.allDocuments()[0]?.status === JobStatus.COMPLETED,
  );
  await worker.stop();

  assert.equal(processor.processedJobIds.length, 1);
});

test('WorkerApplication handles revision mismatch as stale without persistence overwrite', async () => {
  const { collection, queue } = WorkerTestHarness.createQueue();
  const processor = new StaticProcessor({ result: { status: 'stale' } });
  const worker = WorkerTestHarness.createWorker({ processor, queue });

  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());
  await worker.start();
  await WorkerTestHarness.waitFor(() => collection.allDocuments()[0]?.status === JobStatus.STALE);
  await worker.stop();

  assert.equal((await worker.getMetrics()).staleJobs, 1);
});

test('WorkerApplication retries transient failures and then completes', async () => {
  const { clock, collection, queue } = WorkerTestHarness.createQueue();
  let calls = 0;
  const processor = {
    jobType: JobType.FULL_ANALYSIS,
    async process() {
      calls += 1;

      if (calls === 1) {
        throw Object.assign(new Error('transient failure'), { isTransient: true });
      }

      return { status: 'completed' };
    },
  };
  const worker = WorkerTestHarness.createWorker({ processor, queue });

  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());
  await worker.start();
  await WorkerTestHarness.waitFor(() => collection.allDocuments()[0]?.status === JobStatus.QUEUED);
  clock.advance(101);
  await WorkerTestHarness.waitFor(
    () => collection.allDocuments()[0]?.status === JobStatus.COMPLETED,
  );
  await worker.stop();

  assert.equal(calls, 2);
  assert.equal((await worker.getMetrics()).retryCount, 1);
});

test('Worker restart resumes an expired in-flight job', async () => {
  const { clock, collection, queue } = WorkerTestHarness.createQueue({ leaseDurationMs: 50 });
  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());

  const abandonedJob = await queue.claimNextJob('crashed-worker');
  clock.advance(51);

  const processor = new StaticProcessor();
  const restartedWorker = WorkerTestHarness.createWorker({
    processor,
    queue,
    workerId: 'restarted-worker',
  });

  await restartedWorker.start();
  await WorkerTestHarness.waitFor(
    () => collection.allDocuments()[0]?.status === JobStatus.COMPLETED,
  );
  await restartedWorker.stop();

  const completedJob = collection.allDocuments()[0];

  assert.equal(abandonedJob.leaseOwner, 'crashed-worker');
  assert.equal(completedJob.attemptCount, 2);
  assert.equal(completedJob.status, JobStatus.COMPLETED);
});

test('JobProcessorRegistry enforces registration by job type', () => {
  const registry = new JobProcessorRegistry();
  const processor = new StaticProcessor();

  registry.register(processor);

  assert.equal(registry.has(JobType.FULL_ANALYSIS), true);
  assert.equal(registry.get(JobType.FULL_ANALYSIS), processor);
  assert.throws(() => registry.register(processor), /already registered/u);
  assert.throws(() => registry.get(JobType.PARTIAL_RISK), /No processor registered/u);
});

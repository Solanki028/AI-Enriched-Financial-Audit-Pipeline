import assert from 'node:assert/strict';
import test from 'node:test';

import { JobStatus } from '../../src/modules/jobs/policies/JobStatus.js';
import { JobType } from '../../src/modules/jobs/policies/JobType.js';
import { WorkerTestHarness } from '../helpers/WorkerTestHarness.js';

test('MongoJobQueue creates indexes required for polling and deduplication', async () => {
  const { collection, queue } = WorkerTestHarness.createQueue();

  await queue.ensureIndexes();

  assert.deepEqual(
    collection.indexes.map((index) => index.name),
    [
      'job_id_unique',
      'active_job_unique',
      'worker_polling',
      'expired_leases',
      'entry_job_history',
      'completed_retention',
    ],
  );
});

test('MongoJobQueue atomically claims one job at a time', async () => {
  const { queue } = WorkerTestHarness.createQueue();
  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());

  const firstClaim = await queue.claimNextJob('worker-1');
  const secondClaim = await queue.claimNextJob('worker-2');

  assert.equal(firstClaim.status, JobStatus.PROCESSING);
  assert.equal(firstClaim.leaseOwner, 'worker-1');
  assert.equal(secondClaim, null);
});

test('MongoJobQueue recovers an expired lease for another worker', async () => {
  const { clock, queue } = WorkerTestHarness.createQueue({ leaseDurationMs: 1000 });
  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());

  const firstClaim = await queue.claimNextJob('worker-1');
  clock.advance(1001);
  const recoveredClaim = await queue.claimNextJob('worker-2');

  assert.equal(firstClaim.attemptCount, 1);
  assert.equal(recoveredClaim.attemptCount, 2);
  assert.equal(recoveredClaim.leaseOwner, 'worker-2');
});

test('MongoJobQueue prevents duplicate active jobs and stales older revisions', async () => {
  const { collection, queue } = WorkerTestHarness.createQueue();

  const first = await queue.enqueue(WorkerTestHarness.fullAnalysisCommand({ sourceRevision: 1 }));
  const duplicate = await queue.enqueue(
    WorkerTestHarness.fullAnalysisCommand({ sourceRevision: 1 }),
  );
  const newer = await queue.enqueue(WorkerTestHarness.fullAnalysisCommand({ sourceRevision: 2 }));
  const documents = collection.allDocuments();

  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(newer.created, true);
  assert.equal(documents.find((job) => job.sourceRevision === 1).status, JobStatus.STALE);
  assert.equal(documents.find((job) => job.sourceRevision === 2).status, JobStatus.PENDING);
});

test('MongoJobQueue supports retry and dead-letter after max attempts', async () => {
  const { clock, collection, queue } = WorkerTestHarness.createQueue();
  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand({ maxAttempts: 2 }));

  const firstClaim = await queue.claimNextJob('worker-1');
  await queue.fail(
    firstClaim,
    'worker-1',
    Object.assign(new Error('transient'), { isTransient: true }),
  );

  assert.equal(collection.allDocuments()[0].status, JobStatus.QUEUED);

  clock.advance(101);
  const secondClaim = await queue.claimNextJob('worker-1');
  await queue.fail(
    secondClaim,
    'worker-1',
    Object.assign(new Error('transient'), { isTransient: true }),
  );

  assert.equal(collection.allDocuments()[0].status, JobStatus.FAILED);
  assert.equal(collection.allDocuments()[0].failedAt instanceof Date, true);
});

test('MongoJobQueue can cancel and mark stale jobs idempotently', async () => {
  const { collection, queue } = WorkerTestHarness.createQueue();
  await queue.enqueue(WorkerTestHarness.fullAnalysisCommand());

  const job = collection.allDocuments()[0];

  assert.equal(await queue.cancel(job.jobId, 'test cancel'), true);
  assert.equal(await queue.cancel(job.jobId, 'test cancel'), false);
  assert.equal(collection.allDocuments()[0].status, JobStatus.CANCELLED);
});

test('MongoJobQueue supports each required processing job type', async () => {
  const { queue } = WorkerTestHarness.createQueue();

  for (const jobType of JobType.ALL) {
    const result = await queue.enqueue(
      WorkerTestHarness.fullAnalysisCommand({
        entryId: `entry-${jobType}`,
        jobType,
      }),
    );

    assert.equal(result.created, true);
    assert.equal(result.job.jobType, jobType);
  }
});

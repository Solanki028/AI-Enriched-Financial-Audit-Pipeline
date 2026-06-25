import { JobStatus } from '../../modules/jobs/policies/JobStatus.js';

export class MongoJobQueue {
  static COLLECTION_NAME = 'processing_jobs';

  constructor({
    collection,
    errorSerializer,
    jobFactory,
    leaseDurationMs,
    now = () => new Date(),
    retryPolicy,
  }) {
    this.collection = collection;
    this.errorSerializer = errorSerializer;
    this.jobFactory = jobFactory;
    this.leaseDurationMs = leaseDurationMs;
    this.now = now;
    this.retryPolicy = retryPolicy;
  }

  async ensureIndexes() {
    await this.collection.createIndexes([
      {
        key: { jobId: 1 },
        name: 'job_id_unique',
        unique: true,
      },
      {
        key: { activeKey: 1 },
        name: 'active_job_unique',
        partialFilterExpression: { activeKey: { $type: 'string' } },
        unique: true,
      },
      {
        key: { status: 1, availableAt: 1, priority: -1, createdAt: 1 },
        name: 'worker_polling',
      },
      {
        key: { status: 1, leaseExpiresAt: 1 },
        name: 'expired_leases',
      },
      {
        key: { entryId: 1, jobType: 1, sourceRevision: -1, createdAt: -1 },
        name: 'entry_job_history',
      },
      {
        key: { completedAt: 1 },
        name: 'completed_retention',
        sparse: true,
      },
    ]);
  }

  async enqueue(command) {
    const job = this.jobFactory.create(command);
    const now = this.now();

    await this.collection.updateMany(
      {
        activeKey: job.activeKey,
        sourceRevision: { $lt: job.sourceRevision },
        status: { $in: [JobStatus.PENDING, JobStatus.QUEUED] },
      },
      {
        $set: {
          lastError: {
            code: 'SUPERSEDED_BY_NEWER_REVISION',
            message: 'Job was superseded before processing by a newer source revision.',
            occurredAt: now,
            transient: false,
          },
          staleAt: now,
          status: JobStatus.STALE,
          updatedAt: now,
        },
        $unset: { activeKey: '' },
      },
    );

    await this.collection.updateMany(
      {
        activeKey: job.activeKey,
        sourceRevision: { $lt: job.sourceRevision },
        status: JobStatus.PROCESSING,
      },
      {
        $set: {
          lastError: {
            code: 'SUPERSEDED_WHILE_PROCESSING',
            message: 'A newer revision was queued while this job was processing.',
            occurredAt: now,
            transient: false,
          },
          updatedAt: now,
        },
        $unset: { activeKey: '' },
      },
    );

    const existing = await this.collection.findOne({
      activeKey: job.activeKey,
      sourceRevision: { $gte: job.sourceRevision },
      status: { $in: JobStatus.ACTIVE },
    });

    if (existing) {
      return Object.freeze({ created: false, job: existing });
    }

    try {
      await this.collection.insertOne(structuredClone(job));
      return Object.freeze({ created: true, job });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      const duplicate = await this.collection.findOne({
        activeKey: job.activeKey,
        status: { $in: JobStatus.ACTIVE },
      });

      if (!duplicate) {
        throw error;
      }

      return Object.freeze({ created: false, job: duplicate });
    }
  }

  async claimNextJob(workerId) {
    const now = this.now();
    await this.#deadLetterExhaustedLeases(now);
    const leaseExpiresAt = new Date(now.getTime() + this.leaseDurationMs);
    const result = await this.collection.findOneAndUpdate(
      {
        $and: [
          {
            $or: [
              {
                availableAt: { $lte: now },
                status: { $in: [JobStatus.PENDING, JobStatus.QUEUED] },
              },
              {
                leaseExpiresAt: { $lte: now },
                status: JobStatus.PROCESSING,
              },
            ],
          },
          {
            $expr: { $lt: ['$attemptCount', '$maxAttempts'] },
          },
        ],
      },
      {
        $inc: { attemptCount: 1 },
        $set: {
          leaseExpiresAt,
          leaseOwner: workerId,
          startedAt: now,
          status: JobStatus.PROCESSING,
          updatedAt: now,
        },
      },
      {
        returnDocument: 'after',
        sort: { priority: -1, createdAt: 1 },
      },
    );

    return result ?? null;
  }

  async renewLease(jobId, workerId) {
    const now = this.now();
    const result = await this.collection.updateOne(
      {
        jobId,
        leaseOwner: workerId,
        status: JobStatus.PROCESSING,
      },
      {
        $set: {
          leaseExpiresAt: new Date(now.getTime() + this.leaseDurationMs),
          updatedAt: now,
        },
      },
    );

    return result.matchedCount === 1;
  }

  async complete(jobId, workerId) {
    return this.#transitionOwnedJob(jobId, workerId, JobStatus.COMPLETED, {
      completedAt: this.now(),
      lastError: null,
    });
  }

  async fail(job, workerId, error) {
    const now = this.now();
    const lastError = this.errorSerializer.serialize(error, now);

    if (this.retryPolicy.shouldRetry(job, error)) {
      return this.requeue(job.jobId, workerId, {
        availableAt: new Date(now.getTime() + this.retryPolicy.getDelayMs(job.attemptCount)),
        lastError,
      });
    }

    return this.#transitionOwnedJob(job.jobId, workerId, JobStatus.FAILED, {
      failedAt: now,
      lastError,
    });
  }

  async cancel(jobId, reason = 'Job cancelled.') {
    return this.#transitionUnownedJob(jobId, JobStatus.CANCELLED, {
      cancelledAt: this.now(),
      lastError: this.errorSerializer.serialize(
        Object.assign(new Error(reason), { isTransient: false }),
        this.now(),
      ),
    });
  }

  async markStale(jobId, workerId, reason = 'Job source revision is stale.') {
    return this.#transitionOwnedJob(jobId, workerId, JobStatus.STALE, {
      lastError: this.errorSerializer.serialize(
        Object.assign(new Error(reason), {
          code: 'STALE_SOURCE_REVISION',
          isTransient: false,
        }),
        this.now(),
      ),
      staleAt: this.now(),
    });
  }

  async requeue(jobId, workerId, { availableAt = this.now(), lastError = null } = {}) {
    const now = this.now();
    const result = await this.collection.updateOne(
      {
        jobId,
        leaseOwner: workerId,
        status: JobStatus.PROCESSING,
      },
      {
        $set: {
          availableAt,
          lastError,
          leaseExpiresAt: null,
          leaseOwner: null,
          status: JobStatus.QUEUED,
          updatedAt: now,
        },
      },
    );

    return result.matchedCount === 1;
  }

  async getDepth() {
    return this.collection.countDocuments({ status: { $in: JobStatus.ACTIVE } });
  }

  async #deadLetterExhaustedLeases(now) {
    await this.collection.updateMany(
      {
        leaseExpiresAt: { $lte: now },
        status: JobStatus.PROCESSING,
        $expr: { $gte: ['$attemptCount', '$maxAttempts'] },
      },
      {
        $set: {
          failedAt: now,
          lastError: {
            code: 'LEASE_EXPIRED_AFTER_MAX_ATTEMPTS',
            message: 'Worker lease expired after the maximum number of attempts.',
            occurredAt: now,
            transient: false,
          },
          leaseExpiresAt: null,
          leaseOwner: null,
          status: JobStatus.FAILED,
          updatedAt: now,
        },
        $unset: { activeKey: '' },
      },
    );
  }

  async #transitionOwnedJob(jobId, workerId, status, fields) {
    const result = await this.collection.updateOne(
      {
        jobId,
        leaseOwner: workerId,
        status: JobStatus.PROCESSING,
      },
      {
        $set: {
          ...fields,
          leaseExpiresAt: null,
          leaseOwner: null,
          status,
          updatedAt: this.now(),
        },
        $unset: { activeKey: '' },
      },
    );

    return result.matchedCount === 1;
  }

  async #transitionUnownedJob(jobId, status, fields) {
    const result = await this.collection.updateOne(
      {
        jobId,
        status: { $in: [JobStatus.PENDING, JobStatus.QUEUED] },
      },
      {
        $set: {
          ...fields,
          status,
          updatedAt: this.now(),
        },
        $unset: { activeKey: '' },
      },
    );

    return result.matchedCount === 1;
  }
}

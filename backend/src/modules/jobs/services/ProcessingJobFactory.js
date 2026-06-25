import { randomUUID } from 'node:crypto';

import { JobValidationError } from '../errors/JobValidationError.js';
import { JobStatus } from '../policies/JobStatus.js';
import { JobType } from '../policies/JobType.js';
import { ProcessingJob } from './ProcessingJob.js';

export class ProcessingJobFactory {
  constructor({ defaultMaxAttempts, idGenerator = randomUUID, now = () => new Date() }) {
    this.defaultMaxAttempts = defaultMaxAttempts;
    this.idGenerator = idGenerator;
    this.now = now;
  }

  create({
    correlationId,
    entryId,
    jobType,
    maxAttempts = this.defaultMaxAttempts,
    payload = {},
    priority = 0,
    sourceRevision,
  }) {
    this.#validate({ correlationId, entryId, jobType, maxAttempts, priority, sourceRevision });
    const createdAt = this.now();
    const jobId = this.idGenerator();

    return new ProcessingJob({
      activeKey: this.#activeKey(jobType, entryId),
      attemptCount: 0,
      availableAt: createdAt,
      cancelledAt: null,
      completedAt: null,
      correlationId,
      createdAt,
      entryId,
      failedAt: null,
      jobId,
      jobType,
      lastError: null,
      leaseExpiresAt: null,
      leaseOwner: null,
      maxAttempts,
      payload: structuredClone(payload),
      priority,
      sourceRevision,
      staleAt: null,
      startedAt: null,
      status: JobStatus.PENDING,
      updatedAt: createdAt,
    });
  }

  #activeKey(jobType, entryId) {
    return `${jobType}:${String(entryId)}`;
  }

  #validate({ correlationId, entryId, jobType, maxAttempts, priority, sourceRevision }) {
    if (!JobType.ALL.includes(jobType)) {
      throw new JobValidationError(`Unsupported job type ${jobType}.`);
    }

    if (entryId === undefined || entryId === null || String(entryId).length === 0) {
      throw new JobValidationError('entryId is required.');
    }

    if (!Number.isSafeInteger(sourceRevision) || sourceRevision < 0) {
      throw new JobValidationError('sourceRevision must be a non-negative integer.');
    }

    if (!Number.isSafeInteger(priority)) {
      throw new JobValidationError('priority must be an integer.');
    }

    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
      throw new JobValidationError('maxAttempts must be a positive integer.');
    }

    if (typeof correlationId !== 'string' || correlationId.trim().length === 0) {
      throw new JobValidationError('correlationId is required.');
    }
  }
}

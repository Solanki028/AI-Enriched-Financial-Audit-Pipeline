import { setTimeout as delay } from 'node:timers/promises';

export class WorkerRunner {
  constructor({
    concurrency,
    idleBackoffMaxMs,
    jobLeaseManager,
    logger,
    metrics,
    pollIntervalMs,
    processorRegistry,
    queue,
    workerId,
  }) {
    this.concurrency = concurrency;
    this.idleBackoffMaxMs = idleBackoffMaxMs;
    this.jobLeaseManager = jobLeaseManager;
    this.logger = logger;
    this.metrics = metrics;
    this.pollIntervalMs = pollIntervalMs;
    this.processorRegistry = processorRegistry;
    this.queue = queue;
    this.workerId = workerId;
    this.running = false;
    this.loopPromises = [];
  }

  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.loopPromises = Array.from({ length: this.concurrency }, (_, index) =>
      this.#runLoop(index),
    );
  }

  async stop() {
    if (!this.running && this.loopPromises.length === 0) {
      return;
    }

    this.running = false;
    await Promise.allSettled(this.loopPromises);
    this.loopPromises = [];
  }

  async #runLoop(slot) {
    let idleDelayMs = this.pollIntervalMs;

    while (this.running) {
      try {
        const job = await this.queue.claimNextJob(this.workerId);

        if (!job) {
          await delay(idleDelayMs);
          idleDelayMs = Math.min(idleDelayMs * 2, this.idleBackoffMaxMs);
          continue;
        }

        idleDelayMs = this.pollIntervalMs;
        await this.#executeJob(job, slot);
      } catch (error) {
        this.logger.error(
          this.#logContext(null, 0, 0, { err: error, slot }),
          'Worker polling loop failed.',
        );
        await delay(this.pollIntervalMs);
      }
    }
  }

  async #executeJob(job, slot) {
    const startedAt = performance.now();
    let leaseLost = false;
    const lease = this.jobLeaseManager.start(job, () => {
      leaseLost = true;
    });
    const logger = this.logger.child({
      correlationId: job.correlationId,
      entryId: job.entryId,
      jobId: job.jobId,
      sourceRevision: job.sourceRevision,
      workerId: this.workerId,
    });

    logger.info(this.#logContext(job, 0, job.attemptCount - 1, { slot }), 'Job started.');

    try {
      const processor = this.processorRegistry.get(job.jobType);
      const result = await processor.process(job, {
        assertLease: async () => {
          if (leaseLost || !(await this.queue.renewLease(job.jobId, this.workerId))) {
            throw Object.assign(new Error('Worker lease was lost during processing.'), {
              code: 'LEASE_LOST',
              isTransient: true,
            });
          }
        },
      });
      const executionTimeMs = performance.now() - startedAt;

      if (result.status === 'stale') {
        await this.queue.markStale(job.jobId, this.workerId);
        this.metrics.recordStale(executionTimeMs);
        logger.info(
          this.#logContext(job, executionTimeMs, job.attemptCount - 1, { slot }),
          'Job marked stale.',
        );
        return;
      }

      const completed = await this.queue.complete(job.jobId, this.workerId);

      if (!completed) {
        throw Object.assign(new Error('Job completion rejected because its lease was lost.'), {
          code: 'LEASE_LOST',
          isTransient: true,
        });
      }

      this.metrics.recordCompleted(executionTimeMs);
      logger.info(
        this.#logContext(job, executionTimeMs, job.attemptCount - 1, { slot }),
        'Job completed.',
      );
    } catch (error) {
      const executionTimeMs = performance.now() - startedAt;
      const transitioned = await this.queue.fail(job, this.workerId, error);
      const willRetry =
        transitioned && error?.isTransient !== false && job.attemptCount < job.maxAttempts;

      if (willRetry) {
        this.metrics.recordRetry(executionTimeMs);
        logger.warn(
          this.#logContext(job, executionTimeMs, job.attemptCount, { err: error, slot }),
          'Job failed and was scheduled for retry.',
        );
      } else {
        this.metrics.recordFailed(executionTimeMs);
        logger.error(
          this.#logContext(job, executionTimeMs, job.attemptCount - 1, { err: error, slot }),
          'Job failed permanently.',
        );
      }
    } finally {
      lease.stop();
    }
  }

  #logContext(job, executionTime, retryCount, additional = {}) {
    return {
      correlationId: job?.correlationId ?? null,
      entryId: job?.entryId ?? null,
      executionTime: Number(executionTime.toFixed(3)),
      jobId: job?.jobId ?? null,
      retryCount,
      sourceRevision: job?.sourceRevision ?? null,
      workerId: this.workerId,
      ...additional,
    };
  }
}

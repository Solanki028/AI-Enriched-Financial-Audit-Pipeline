export class ProcessingMetrics {
  constructor({ now = () => new Date() } = {}) {
    this.now = now;
    this.completedJobs = 0;
    this.failedJobs = 0;
    this.retriedJobs = 0;
    this.staleJobs = 0;
    this.totalProcessingTimeMs = 0;
    this.processedJobs = 0;
  }

  recordCompleted(executionTimeMs) {
    this.completedJobs += 1;
    this.#recordProcessingTime(executionTimeMs);
  }

  recordFailed(executionTimeMs) {
    this.failedJobs += 1;
    this.#recordProcessingTime(executionTimeMs);
  }

  recordRetry(executionTimeMs) {
    this.retriedJobs += 1;
    this.#recordProcessingTime(executionTimeMs);
  }

  recordStale(executionTimeMs) {
    this.staleJobs += 1;
    this.#recordProcessingTime(executionTimeMs);
  }

  async snapshot(queue) {
    return Object.freeze({
      averageProcessingTimeMs:
        this.processedJobs === 0 ? 0 : this.totalProcessingTimeMs / this.processedJobs,
      completedJobs: this.completedJobs,
      failedJobs: this.failedJobs,
      queueDepth: await queue.getDepth(),
      recordedAt: this.now(),
      retryCount: this.retriedJobs,
      staleJobs: this.staleJobs,
    });
  }

  #recordProcessingTime(executionTimeMs) {
    this.processedJobs += 1;
    this.totalProcessingTimeMs += executionTimeMs;
  }
}

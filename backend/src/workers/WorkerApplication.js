export class WorkerApplication {
  constructor({ logger, metrics, queue, runner }) {
    this.logger = logger;
    this.metrics = metrics;
    this.queue = queue;
    this.runner = runner;
    this.started = false;
  }

  async start() {
    if (this.started) {
      return;
    }

    await this.queue.ensureIndexes();
    this.runner.start();
    this.started = true;
    this.#log('Worker application started.');
  }

  async stop() {
    if (!this.started) {
      return;
    }

    await this.runner.stop();
    this.started = false;
    this.#log('Worker application stopped.');
  }

  getMetrics() {
    return this.metrics.snapshot(this.queue);
  }

  #log(message) {
    this.logger.info(
      {
        correlationId: null,
        entryId: null,
        executionTime: 0,
        jobId: null,
        retryCount: 0,
        sourceRevision: null,
        workerId: this.runner.workerId,
      },
      message,
    );
  }
}

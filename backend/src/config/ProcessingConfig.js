export class ProcessingConfig {
  constructor(environmentConfig) {
    this.modelDelayMs = environmentConfig.getInteger('PROCESSING_MODEL_DELAY_MS', {
      defaultValue: 400,
      minimum: 0,
      maximum: 60000,
    });
    this.workerConcurrency = environmentConfig.getInteger('PROCESSING_WORKER_CONCURRENCY', {
      defaultValue: 4,
      minimum: 1,
      maximum: 100,
    });
    this.migrationBatchSize = environmentConfig.getInteger('PROCESSING_MIGRATION_BATCH_SIZE', {
      defaultValue: 100,
      minimum: 1,
      maximum: 5000,
    });
    this.queueBackpressureLimit = environmentConfig.getInteger(
      'PROCESSING_QUEUE_BACKPRESSURE_LIMIT',
      {
        defaultValue: 1000,
        minimum: 1,
        maximum: 1000000,
      },
    );

    Object.freeze(this);
  }
}

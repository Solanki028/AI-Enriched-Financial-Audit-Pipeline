export class QueueConfig {
  constructor(environmentConfig) {
    this.pollIntervalMs = environmentConfig.getInteger('QUEUE_POLL_INTERVAL_MS', {
      defaultValue: 500,
      minimum: 50,
      maximum: 60000,
    });
    this.idleBackoffMaxMs = environmentConfig.getInteger('QUEUE_IDLE_BACKOFF_MAX_MS', {
      defaultValue: 5000,
      minimum: this.pollIntervalMs,
      maximum: 300000,
    });
    this.leaseDurationMs = environmentConfig.getInteger('QUEUE_LEASE_DURATION_MS', {
      defaultValue: 30000,
      minimum: 1000,
      maximum: 3600000,
    });
    this.maxAttempts = environmentConfig.getInteger('QUEUE_MAX_ATTEMPTS', {
      defaultValue: 3,
      minimum: 1,
      maximum: 20,
    });
    this.retryBaseDelayMs = environmentConfig.getInteger('QUEUE_RETRY_BASE_DELAY_MS', {
      defaultValue: 1000,
      minimum: 100,
      maximum: 300000,
    });

    Object.freeze(this);
  }
}

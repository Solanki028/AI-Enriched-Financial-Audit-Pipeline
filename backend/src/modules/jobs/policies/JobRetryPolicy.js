import { PermanentJobError } from '../errors/PermanentJobError.js';

export class JobRetryPolicy {
  constructor({ baseDelayMs, maximumDelayMs = Number.MAX_SAFE_INTEGER }) {
    this.baseDelayMs = baseDelayMs;
    this.maximumDelayMs = maximumDelayMs;
    Object.freeze(this);
  }

  shouldRetry(job, error) {
    if (error instanceof PermanentJobError || error?.isTransient === false) {
      return false;
    }

    return job.attemptCount < job.maxAttempts;
  }

  getDelayMs(attemptCount) {
    const exponent = Math.max(attemptCount - 1, 0);
    return Math.min(this.baseDelayMs * 2 ** exponent, this.maximumDelayMs);
  }
}

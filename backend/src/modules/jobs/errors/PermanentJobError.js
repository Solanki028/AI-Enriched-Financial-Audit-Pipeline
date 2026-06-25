export class PermanentJobError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'PermanentJobError';
    this.isTransient = false;
    Error.captureStackTrace(this, PermanentJobError);
  }
}

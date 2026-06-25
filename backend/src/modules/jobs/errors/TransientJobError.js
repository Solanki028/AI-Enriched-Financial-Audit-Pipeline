export class TransientJobError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'TransientJobError';
    this.isTransient = true;
    Error.captureStackTrace(this, TransientJobError);
  }
}

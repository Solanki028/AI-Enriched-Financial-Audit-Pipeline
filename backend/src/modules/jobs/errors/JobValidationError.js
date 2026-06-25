export class JobValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'JobValidationError';
    this.details = details;
    Error.captureStackTrace(this, JobValidationError);
  }
}

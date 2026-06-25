export class AnalysisInputError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'AnalysisInputError';
    this.details = details;
    Error.captureStackTrace(this, AnalysisInputError);
  }
}

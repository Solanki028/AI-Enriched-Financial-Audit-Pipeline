export class AnalysisConfigurationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'AnalysisConfigurationError';
    this.details = details;
    Error.captureStackTrace(this, AnalysisConfigurationError);
  }
}

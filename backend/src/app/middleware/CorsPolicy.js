import { ApplicationError } from '../../shared/errors/ApplicationError.js';

export class CorsPolicy {
  constructor(allowedOrigins) {
    this.allowedOrigins = new Set(allowedOrigins);
    this.validateOrigin = this.validateOrigin.bind(this);
  }

  validateOrigin(origin, callback) {
    if (!origin || this.allowedOrigins.has('*') || this.allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new ApplicationError({
        message: 'The request origin is not allowed.',
        statusCode: 403,
        code: 'CORS_ORIGIN_DENIED',
      }),
    );
  }
}

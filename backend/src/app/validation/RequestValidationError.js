import { ApplicationError } from '../../shared/errors/ApplicationError.js';

export class RequestValidationError extends ApplicationError {
  constructor(details) {
    super({
      code: 'REQUEST_VALIDATION_FAILED',
      details,
      message: 'Request validation failed.',
      statusCode: 400,
    });
  }
}

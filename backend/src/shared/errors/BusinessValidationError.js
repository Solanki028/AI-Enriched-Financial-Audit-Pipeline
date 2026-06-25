import { ApplicationError } from './ApplicationError.js';

export class BusinessValidationError extends ApplicationError {
  constructor(message = 'Business validation failed.', details) {
    super({ code: 'BUSINESS_VALIDATION_FAILED', details, message, statusCode: 422 });
  }
}

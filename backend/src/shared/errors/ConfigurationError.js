import { ApplicationError } from './ApplicationError.js';

export class ConfigurationError extends ApplicationError {
  constructor(message, details) {
    super({
      message,
      statusCode: 500,
      code: 'CONFIGURATION_ERROR',
      details,
      isOperational: false,
    });
  }
}

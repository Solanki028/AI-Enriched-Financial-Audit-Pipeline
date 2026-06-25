import { ApplicationError } from './ApplicationError.js';

export class DependencyUnavailableError extends ApplicationError {
  constructor(message = 'Required application dependency is unavailable.', details) {
    super({ code: 'DEPENDENCY_UNAVAILABLE', details, message, statusCode: 503 });
  }
}

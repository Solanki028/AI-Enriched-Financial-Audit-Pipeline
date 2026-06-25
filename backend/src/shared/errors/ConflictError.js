import { ApplicationError } from './ApplicationError.js';

export class ConflictError extends ApplicationError {
  constructor(message = 'Request conflicts with the current resource state.', details) {
    super({ code: 'CONFLICT', details, message, statusCode: 409 });
  }
}

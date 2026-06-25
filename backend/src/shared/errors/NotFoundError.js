import { ApplicationError } from './ApplicationError.js';

export class NotFoundError extends ApplicationError {
  constructor(message = 'Resource was not found.', details) {
    super({ code: 'NOT_FOUND', details, message, statusCode: 404 });
  }
}

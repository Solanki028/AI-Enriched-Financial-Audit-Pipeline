import { ApplicationError } from '../../shared/errors/ApplicationError.js';

export class NotFoundHandler {
  constructor() {
    this.handle = this.handle.bind(this);
  }

  handle(request, _response, next) {
    next(
      new ApplicationError({
        message: `Resource ${request.method} ${request.originalUrl} was not found.`,
        statusCode: 404,
        code: 'RESOURCE_NOT_FOUND',
      }),
    );
  }
}

import { ApplicationError } from '../../shared/errors/ApplicationError.js';

export class ErrorHandler {
  constructor(logger, environment) {
    this.logger = logger;
    this.environment = environment;
    this.handle = this.handle.bind(this);
  }

  handle(error, request, response, _next) {
    const normalizedError = this.#normalize(error);
    const logger = request.logger ?? this.logger;

    logger.error(
      {
        code: normalizedError.code,
        err: normalizedError,
        method: request.method,
        requestId: request.requestId,
        statusCode: normalizedError.statusCode,
        url: request.originalUrl,
      },
      'HTTP request failed.',
    );

    const body = {
      error: {
        code: normalizedError.code,
        message: normalizedError.isOperational
          ? normalizedError.message
          : 'An unexpected error occurred.',
        requestId: request.requestId,
      },
    };

    if (normalizedError.details !== undefined) {
      body.error.details = normalizedError.details;
    }

    if (this.environment === 'development' && !normalizedError.isOperational) {
      body.error.stack = normalizedError.stack;
    }

    response.status(normalizedError.statusCode).json(body);
  }

  #normalize(error) {
    if (error instanceof ApplicationError) {
      return error;
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return new ApplicationError({
        message: 'Request body contains invalid JSON.',
        statusCode: 400,
        code: 'INVALID_JSON',
        cause: error,
      });
    }

    return new ApplicationError({
      message: error instanceof Error ? error.message : 'Unknown application error.',
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      isOperational: false,
      cause: error instanceof Error ? error : undefined,
    });
  }
}

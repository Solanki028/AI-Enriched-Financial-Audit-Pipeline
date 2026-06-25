export class ApplicationError extends Error {
  constructor({
    message,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details,
    isOperational = true,
    cause,
  }) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

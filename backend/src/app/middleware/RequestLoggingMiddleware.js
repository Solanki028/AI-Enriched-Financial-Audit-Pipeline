export class RequestLoggingMiddleware {
  constructor(logger) {
    this.logger = logger;
    this.handle = this.handle.bind(this);
  }

  handle(request, response, next) {
    const startedAt = process.hrtime.bigint();
    const requestLogger = this.logger.child({ requestId: request.requestId });

    request.logger = requestLogger;

    response.once('finish', () => {
      const elapsedNanoseconds = process.hrtime.bigint() - startedAt;
      const responseTime = Number(elapsedNanoseconds) / 1_000_000;

      requestLogger.info(
        {
          method: request.method,
          requestId: request.requestId,
          responseTime: Number(responseTime.toFixed(3)),
          statusCode: response.statusCode,
          url: request.originalUrl,
        },
        'HTTP request completed.',
      );
    });

    next();
  }
}

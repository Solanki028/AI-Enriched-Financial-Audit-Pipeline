import pino from 'pino';

export class ApplicationLogger {
  constructor(loggerConfig, { environment, version, bindings = {} }) {
    this.logger = pino({
      base: {
        environment,
        service: loggerConfig.serviceName,
        version,
        ...bindings,
      },
      level: loggerConfig.level,
      messageKey: 'message',
      redact: {
        paths: loggerConfig.redactPaths,
        censor: '[REDACTED]',
      },
      timestamp: ApplicationLogger.createTimestamp,
    });
  }

  static createTimestamp() {
    return `,"timestamp":"${new Date().toISOString()}"`;
  }

  child(bindings) {
    const childLogger = Object.create(ApplicationLogger.prototype);
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }

  withCorrelationId(correlationId) {
    return this.child({ correlationId });
  }

  trace(context, message) {
    this.logger.trace(context, message);
  }

  debug(context, message) {
    this.logger.debug(context, message);
  }

  info(context, message) {
    this.logger.info(context, message);
  }

  warn(context, message) {
    this.logger.warn(context, message);
  }

  error(context, message) {
    this.logger.error(context, message);
  }

  fatal(context, message) {
    this.logger.fatal(context, message);
  }

  flush() {
    this.logger.flush();
  }
}

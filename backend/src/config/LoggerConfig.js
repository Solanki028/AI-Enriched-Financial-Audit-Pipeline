export class LoggerConfig {
  constructor(environmentConfig) {
    this.level = environmentConfig.getEnum(
      'LOG_LEVEL',
      ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      'info',
    );
    this.serviceName = environmentConfig.getOptionalString(
      'LOG_SERVICE_NAME',
      'financial-audit-backend',
    );
    this.redactPaths = environmentConfig.getCsv('LOG_REDACT_PATHS', [
      'req.headers.authorization',
      'req.headers.cookie',
    ]);

    Object.freeze(this);
  }
}

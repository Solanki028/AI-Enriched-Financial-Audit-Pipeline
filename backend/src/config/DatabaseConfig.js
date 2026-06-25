import { ConfigurationError } from '../shared/errors/ConfigurationError.js';

export class DatabaseConfig {
  constructor(environmentConfig) {
    this.uri = environmentConfig.getRequiredString('MONGODB_URI');
    this.databaseName = environmentConfig.getRequiredString('MONGODB_DB_NAME');
    this.minPoolSize = environmentConfig.getInteger('MONGODB_MIN_POOL_SIZE', {
      defaultValue: 1,
      minimum: 0,
      maximum: 100,
    });
    this.maxPoolSize = environmentConfig.getInteger('MONGODB_MAX_POOL_SIZE', {
      defaultValue: 20,
      minimum: 1,
      maximum: 500,
    });
    this.connectTimeoutMs = environmentConfig.getInteger('MONGODB_CONNECT_TIMEOUT_MS', {
      defaultValue: 10000,
      minimum: 100,
      maximum: 120000,
    });
    this.serverSelectionTimeoutMs = environmentConfig.getInteger(
      'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
      {
        defaultValue: 5000,
        minimum: 100,
        maximum: 120000,
      },
    );
    this.connectRetryAttempts = environmentConfig.getInteger('MONGODB_CONNECT_RETRY_ATTEMPTS', {
      defaultValue: 5,
      minimum: 1,
      maximum: 20,
    });
    this.connectRetryBaseDelayMs = environmentConfig.getInteger(
      'MONGODB_CONNECT_RETRY_BASE_DELAY_MS',
      {
        defaultValue: 500,
        minimum: 50,
        maximum: 30000,
      },
    );

    this.#validate();

    Object.freeze(this);
  }

  get clientOptions() {
    return Object.freeze({
      appName: 'ai-enriched-financial-audit-pipeline',
      connectTimeoutMS: this.connectTimeoutMs,
      maxPoolSize: this.maxPoolSize,
      minPoolSize: this.minPoolSize,
      retryReads: true,
      retryWrites: true,
      serverSelectionTimeoutMS: this.serverSelectionTimeoutMs,
    });
  }

  #validate() {
    if (!this.uri.startsWith('mongodb://') && !this.uri.startsWith('mongodb+srv://')) {
      throw new ConfigurationError(
        'MONGODB_URI must use the mongodb:// or mongodb+srv:// protocol.',
      );
    }

    if (!/^[^/\\. "$*<>:|?]+$/.test(this.databaseName)) {
      throw new ConfigurationError('MONGODB_DB_NAME contains unsupported characters.');
    }

    if (this.minPoolSize > this.maxPoolSize) {
      throw new ConfigurationError('MONGODB_MIN_POOL_SIZE cannot exceed MONGODB_MAX_POOL_SIZE.');
    }
  }
}

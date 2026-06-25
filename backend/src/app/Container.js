import packageMetadata from '../../package.json' with { type: 'json' };

import { DatabaseConfig } from '../config/DatabaseConfig.js';
import { EnvironmentConfig } from '../config/EnvironmentConfig.js';
import { LoggerConfig } from '../config/LoggerConfig.js';
import { ProcessingConfig } from '../config/ProcessingConfig.js';
import { QueueConfig } from '../config/QueueConfig.js';
import { MongoConnection } from '../infrastructure/database/MongoConnection.js';
import { ApplicationLogger } from '../infrastructure/logging/ApplicationLogger.js';
import { HealthMonitor } from '../infrastructure/monitoring/HealthMonitor.js';
import { Application } from './Application.js';
import { Server } from './Server.js';

export class Container {
  constructor({ environmentSource, envFile } = {}) {
    this.environmentConfig = new EnvironmentConfig({
      source: environmentSource,
      envFile,
    });
    this.applicationConfig = this.#createApplicationConfig();
    this.databaseConfig = new DatabaseConfig(this.environmentConfig);
    this.queueConfig = new QueueConfig(this.environmentConfig);
    this.processingConfig = new ProcessingConfig(this.environmentConfig);
    this.loggerConfig = new LoggerConfig(this.environmentConfig);
    this.logger = new ApplicationLogger(this.loggerConfig, {
      environment: this.applicationConfig.environment,
      version: packageMetadata.version,
    });
    this.mongoConnection = new MongoConnection(this.databaseConfig, this.logger);
    this.healthMonitor = new HealthMonitor({
      mongoConnection: this.mongoConnection,
      version: packageMetadata.version,
    });
    this.application = new Application({
      applicationConfig: this.applicationConfig,
      healthMonitor: this.healthMonitor,
      logger: this.logger,
    });
    this.server = new Server({
      application: this.application,
      host: this.applicationConfig.host,
      logger: this.logger,
      port: this.applicationConfig.port,
      shutdownTimeoutMs: this.applicationConfig.shutdownTimeoutMs,
    });
  }

  #createApplicationConfig() {
    this.environmentConfig.getRequiredString('CORS_ORIGINS');

    return Object.freeze({
      corsOrigins: this.environmentConfig.getCsv('CORS_ORIGINS'),
      environment: this.environmentConfig.getEnum('NODE_ENV', [
        'development',
        'test',
        'production',
      ]),
      host: this.environmentConfig.getRequiredString('APP_HOST'),
      jsonLimit: this.environmentConfig.getOptionalString('APP_JSON_LIMIT', '1mb'),
      port: this.environmentConfig.getInteger('APP_PORT', {
        minimum: 1,
        maximum: 65535,
      }),
      shutdownTimeoutMs: this.environmentConfig.getInteger('APP_SHUTDOWN_TIMEOUT_MS', {
        defaultValue: 10000,
        minimum: 1000,
        maximum: 120000,
      }),
      version: packageMetadata.version,
    });
  }
}

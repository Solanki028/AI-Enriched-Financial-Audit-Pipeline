import assert from 'node:assert/strict';
import test from 'node:test';

import { DatabaseConfig } from '../../src/config/DatabaseConfig.js';
import { EnvironmentConfig } from '../../src/config/EnvironmentConfig.js';
import { ConfigurationError } from '../../src/shared/errors/ConfigurationError.js';

class DatabaseConfigFactory {
  static create(overrides = {}) {
    const environment = new EnvironmentConfig({
      source: {
        MONGODB_DB_NAME: 'financial_audit',
        MONGODB_URI: 'mongodb://127.0.0.1:27017',
        ...overrides,
      },
    });

    return new DatabaseConfig(environment);
  }
}

test('DatabaseConfig exposes production-safe MongoDB client options', () => {
  const config = DatabaseConfigFactory.create();

  assert.equal(config.databaseName, 'financial_audit');
  assert.equal(config.clientOptions.retryReads, true);
  assert.equal(config.clientOptions.retryWrites, true);
  assert.equal(config.clientOptions.maxPoolSize, 20);
});

test('DatabaseConfig rejects unsupported connection protocols', () => {
  assert.throws(
    () => DatabaseConfigFactory.create({ MONGODB_URI: 'http://127.0.0.1:27017' }),
    ConfigurationError,
  );
});

test('DatabaseConfig rejects an invalid pool range', () => {
  assert.throws(
    () =>
      DatabaseConfigFactory.create({
        MONGODB_MAX_POOL_SIZE: '5',
        MONGODB_MIN_POOL_SIZE: '10',
      }),
    ConfigurationError,
  );
});

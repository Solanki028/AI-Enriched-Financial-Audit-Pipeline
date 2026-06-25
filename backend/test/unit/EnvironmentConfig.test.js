import assert from 'node:assert/strict';
import test from 'node:test';

import { EnvironmentConfig } from '../../src/config/EnvironmentConfig.js';
import { ConfigurationError } from '../../src/shared/errors/ConfigurationError.js';

test('EnvironmentConfig returns typed values', () => {
  const config = new EnvironmentConfig({
    source: {
      BOOLEAN_VALUE: 'true',
      CSV_VALUE: 'first, second',
      ENUM_VALUE: 'development',
      INTEGER_VALUE: '42',
      STRING_VALUE: ' value ',
    },
  });

  assert.equal(config.getBoolean('BOOLEAN_VALUE'), true);
  assert.deepEqual(config.getCsv('CSV_VALUE'), ['first', 'second']);
  assert.equal(config.getEnum('ENUM_VALUE', ['development', 'production']), 'development');
  assert.equal(config.getInteger('INTEGER_VALUE', { minimum: 1 }), 42);
  assert.equal(config.getRequiredString('STRING_VALUE'), 'value');
});

test('EnvironmentConfig fails fast for missing required values', () => {
  const config = new EnvironmentConfig({ source: {} });

  assert.throws(() => config.getRequiredString('REQUIRED_VALUE'), ConfigurationError);
});

test('EnvironmentConfig rejects invalid integers', () => {
  const config = new EnvironmentConfig({
    source: {
      INTEGER_VALUE: '4.2',
    },
  });

  assert.throws(() => config.getInteger('INTEGER_VALUE', { minimum: 1 }), ConfigurationError);
});

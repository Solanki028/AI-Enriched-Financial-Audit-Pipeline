import assert from 'node:assert/strict';
import test from 'node:test';

import { AnalysisConfigurationError } from '../../src/modules/analysis/errors/AnalysisConfigurationError.js';
import { AnalysisConfiguration } from '../../src/modules/analysis/pipelines/AnalysisConfiguration.js';
import { EntryNormalizer } from '../../src/modules/analysis/pipelines/EntryNormalizer.js';
import { AnalysisFixture } from '../helpers/AnalysisFixture.js';

test('AnalysisConfiguration validates and deeply freezes intelligence settings', () => {
  const configuration = new AnalysisConfiguration(AnalysisFixture.configuration()).value;

  assert.equal(Object.isFrozen(configuration), true);
  assert.equal(Object.isFrozen(configuration.risk.rules), true);
  assert.equal(configuration.risk.severityThresholds.high, 0.7);
});

test('AnalysisConfiguration rejects invalid severity thresholds', () => {
  const configuration = AnalysisFixture.configuration();
  configuration.risk.severityThresholds.medium = 0.8;

  assert.throws(() => new AnalysisConfiguration(configuration), AnalysisConfigurationError);
});

test('EntryNormalizer requires timezone-explicit posting dates', () => {
  const normalizer = new EntryNormalizer();

  assert.throws(
    () => normalizer.normalize(AnalysisFixture.normalEntry({ postingDate: '2026-06-22T10:30:00' })),
    /explicit timezone/u,
  );
});

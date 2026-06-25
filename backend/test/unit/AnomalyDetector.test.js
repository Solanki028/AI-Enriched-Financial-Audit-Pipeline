import assert from 'node:assert/strict';
import test from 'node:test';

import { AnomalyDetector } from '../../src/modules/analysis/anomalies/AnomalyDetector.js';
import { AnalysisFixture } from '../helpers/AnalysisFixture.js';

test('AnomalyDetector reports independent field-level anomalies', () => {
  const configuration = AnalysisFixture.configuration();
  const detector = AnomalyDetector.fromConfiguration(configuration.anomalies);
  const anomalies = detector.detect(AnalysisFixture.highRiskEntry());

  assert.deepEqual(
    anomalies.map((anomaly) => anomaly.type),
    ['debit_credit_mismatch', 'numeric_outlier', 'semantic_anomaly', 'unusual_posting_time'],
  );
  assert.equal(
    anomalies.every((anomaly) => Object.isFrozen(anomaly.metadata)),
    true,
  );
});

test('AnomalyDetector returns no anomalies for a normal entry', () => {
  const configuration = AnalysisFixture.configuration();
  const detector = AnomalyDetector.fromConfiguration(configuration.anomalies);

  assert.deepEqual(detector.detect(AnalysisFixture.normalEntry()), []);
});

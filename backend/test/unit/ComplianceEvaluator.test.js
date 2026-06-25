import assert from 'node:assert/strict';
import test from 'node:test';

import { ComplianceEvaluator } from '../../src/modules/analysis/compliance/ComplianceEvaluator.js';
import { AnalysisFixture } from '../helpers/AnalysisFixture.js';

test('ComplianceEvaluator remains independent and returns a compliant result', () => {
  const configuration = AnalysisFixture.configuration();
  const evaluator = ComplianceEvaluator.fromConfiguration(configuration.compliance);
  const result = evaluator.evaluate(AnalysisFixture.normalEntry());

  assert.equal(result.compliant, true);
  assert.deepEqual(result.violations, []);
  assert.deepEqual(result.warnings, []);
});

test('ComplianceEvaluator returns violations and warnings separately', () => {
  const configuration = AnalysisFixture.configuration();
  const evaluator = ComplianceEvaluator.fromConfiguration(configuration.compliance);
  const result = evaluator.evaluate(
    AnalysisFixture.highRiskEntry({
      currency: 'XYZ',
      entryNo: '',
    }),
  );

  assert.equal(result.compliant, false);
  assert.equal(result.violations.length, 3);
  assert.equal(result.warnings.length, 1);
});

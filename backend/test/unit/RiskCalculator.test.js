import assert from 'node:assert/strict';
import test from 'node:test';

import { RiskCalculator } from '../../src/modules/analysis/risk/RiskCalculator.js';
import { RiskEngineFactory } from '../../src/modules/analysis/risk/RiskEngineFactory.js';
import { SeverityClassifier } from '../../src/modules/analysis/risk/SeverityClassifier.js';
import { AnalysisFixture } from '../helpers/AnalysisFixture.js';

class ConfigurableFutureRiskRule {
  constructor() {
    this.id = 'future_rule';
    this.enabled = true;
    this.weight = 1;
  }

  evaluate() {
    return {
      fields: Object.freeze(['entryNo']),
      metadata: Object.freeze({ source: 'test-extension' }),
      triggered: true,
    };
  }
}

test('RiskCalculator deterministically calculates weighted risk', () => {
  const configuration = AnalysisFixture.configuration();
  const { riskCalculator } = new RiskEngineFactory().create(configuration.risk);
  const entry = AnalysisFixture.highRiskEntry();

  const firstResult = riskCalculator.calculate(entry);
  const secondResult = riskCalculator.calculate(entry);

  assert.deepEqual(firstResult, secondResult);
  assert.equal(firstResult.riskScore, 1);
  assert.equal(firstResult.severity, 'HIGH');
  assert.deepEqual(
    firstResult.triggeredRules.map((rule) => rule.rule),
    [
      'debit_credit_mismatch',
      'unusual_posting_time',
      'unusually_large_amount',
      'suspicious_description',
    ],
  );
});

test('RiskCalculator returns zero risk when no configured rule is triggered', () => {
  const configuration = AnalysisFixture.configuration();
  const { riskCalculator } = new RiskEngineFactory().create(configuration.risk);
  const result = riskCalculator.calculate(AnalysisFixture.normalEntry());

  assert.equal(result.riskScore, 0);
  assert.equal(result.severity, 'LOW');
  assert.deepEqual(result.triggeredRules, []);
});

test('RiskCalculator supports additional injected business rules', () => {
  const calculator = new RiskCalculator({
    precision: 4,
    rules: [new ConfigurableFutureRiskRule()],
    severityClassifier: new SeverityClassifier({ high: 0.7, medium: 0.3 }),
  });

  const result = calculator.calculate(AnalysisFixture.normalEntry());

  assert.equal(result.riskScore, 1);
  assert.equal(result.triggeredRules[0].rule, 'future_rule');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { FullAnalysisPipeline } from '../../src/modules/analysis/pipelines/FullAnalysisPipeline.js';

class OrderedStage {
  constructor(name, calls, method, result) {
    this.name = name;
    this.calls = calls;
    this.method = method;
    this.result = result;
  }

  normalize(entry) {
    this.#record('normalize');
    return entry;
  }

  generate() {
    this.#record('generate');
    return Object.freeze([1]);
  }

  detect() {
    this.#record('detect');
    return Object.freeze([]);
  }

  calculate() {
    this.#record('calculate');
    return Object.freeze({
      riskScore: 0,
      severity: 'LOW',
      triggeredRules: Object.freeze([]),
    });
  }

  classify() {
    this.#record('classify');
    return 'LOW';
  }

  evaluate() {
    this.#record('evaluate');
    return Object.freeze({
      compliant: true,
      violations: Object.freeze([]),
      warnings: Object.freeze([]),
    });
  }

  getVersion() {
    return 'v1.0';
  }

  getVersions() {
    return Object.freeze({ test: 'v1.0' });
  }

  #record(method) {
    if (method === this.method) {
      this.calls.push(this.name);
    }
  }
}

test('FullAnalysisPipeline executes intelligence stages in the required order', () => {
  const calls = [];
  const pipeline = new FullAnalysisPipeline({
    anomalyDetector: new OrderedStage('anomalies', calls, 'detect'),
    complianceEvaluator: new OrderedStage('compliance', calls, 'evaluate'),
    contextVersionManager: new OrderedStage('contextVersion', calls, 'none'),
    entityVectorGenerator: new OrderedStage('entity', calls, 'generate'),
    entryNormalizer: new OrderedStage('input', calls, 'normalize'),
    financialVectorGenerator: new OrderedStage('financial', calls, 'generate'),
    modelVersionManager: new OrderedStage('modelVersions', calls, 'none'),
    riskCalculator: new OrderedStage('risk', calls, 'calculate'),
    semanticVectorGenerator: new OrderedStage('semantic', calls, 'generate'),
    severityClassifier: new OrderedStage('severity', calls, 'classify'),
  });

  pipeline.analyze({ _id: 'entry-1', sourceRevision: 1 });

  assert.deepEqual(calls, [
    'input',
    'semantic',
    'financial',
    'entity',
    'anomalies',
    'risk',
    'severity',
    'compliance',
  ]);
});

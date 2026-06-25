import assert from 'node:assert/strict';
import test from 'node:test';

import { AnalysisResult } from '../../src/modules/analysis/pipelines/AnalysisResult.js';
import { FullAnalysisPipelineFactory } from '../../src/modules/analysis/pipelines/FullAnalysisPipelineFactory.js';
import { AnalysisFixture } from '../helpers/AnalysisFixture.js';

test('FullAnalysisPipeline produces a complete immutable deterministic result', () => {
  const pipeline = new FullAnalysisPipelineFactory().create(AnalysisFixture.configuration());
  const entry = AnalysisFixture.highRiskEntry();

  const firstResult = pipeline.analyze(entry);
  const secondResult = pipeline.analyze(structuredClone(entry));

  assert.equal(firstResult instanceof AnalysisResult, true);
  assert.deepEqual(firstResult, secondResult);
  assert.equal(firstResult.riskScore, 1);
  assert.equal(firstResult.severity, 'HIGH');
  assert.equal(firstResult.anomalies.length, 4);
  assert.equal(firstResult.compliance.compliant, false);
  assert.equal(firstResult.vectors.semantic.length, 8);
  assert.equal(firstResult.vectors.financial.length, 8);
  assert.equal(firstResult.vectors.entity.length, 8);
  assert.equal(firstResult.contextVersion, 'v1.0');
  assert.equal(Object.isFrozen(firstResult), true);
  assert.equal(Object.isFrozen(firstResult.vectors), true);
  assert.equal(Object.isFrozen(firstResult.anomalies), true);
});

test('FullAnalysisPipeline does not mutate the source entry', () => {
  const pipeline = new FullAnalysisPipelineFactory().create(AnalysisFixture.configuration());
  const entry = AnalysisFixture.normalEntry();
  const originalEntry = structuredClone(entry);

  pipeline.analyze(entry);

  assert.deepEqual(entry, originalEntry);
});

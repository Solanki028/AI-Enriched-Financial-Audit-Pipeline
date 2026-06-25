import assert from 'node:assert/strict';
import test from 'node:test';

import { VectorEngineFactory } from '../../src/modules/analysis/vectors/VectorEngineFactory.js';
import { AnalysisFixture } from '../helpers/AnalysisFixture.js';

class VectorAssertions {
  static magnitude(vector) {
    return Math.sqrt(vector.reduce((total, value) => total + value ** 2, 0));
  }

  static verify(generator, entry, expectedLength) {
    const firstVector = generator.generate(entry);
    const secondVector = generator.generate(structuredClone(entry));

    assert.equal(firstVector.length, expectedLength);
    assert.deepEqual(firstVector, secondVector);
    assert.equal(Object.isFrozen(firstVector), true);
    assert.equal(Math.abs(this.magnitude(firstVector) - 1) < Number.EPSILON * 100, true);
  }
}

test('all vector generators produce fixed-length deterministic normalized vectors', () => {
  const configuration = AnalysisFixture.configuration();
  const engines = new VectorEngineFactory().create(configuration.vectors);
  const entry = AnalysisFixture.normalEntry();

  VectorAssertions.verify(
    engines.semanticVectorGenerator,
    entry,
    configuration.vectors.semanticLength,
  );
  VectorAssertions.verify(
    engines.financialVectorGenerator,
    entry,
    configuration.vectors.financialLength,
  );
  VectorAssertions.verify(engines.entityVectorGenerator, entry, configuration.vectors.entityLength);
});

test('source data changes alter the corresponding vectors', () => {
  const configuration = AnalysisFixture.configuration();
  const engines = new VectorEngineFactory().create(configuration.vectors);
  const entry = AnalysisFixture.normalEntry();

  assert.notDeepEqual(
    engines.semanticVectorGenerator.generate(entry),
    engines.semanticVectorGenerator.generate({ ...entry, description: 'Different transaction' }),
  );
  assert.notDeepEqual(
    engines.financialVectorGenerator.generate(entry),
    engines.financialVectorGenerator.generate({ ...entry, amount: 900000 }),
  );
  assert.notDeepEqual(
    engines.entityVectorGenerator.generate(entry),
    engines.entityVectorGenerator.generate({ ...entry, companyId: 'company-2' }),
  );
});

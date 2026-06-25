import assert from 'node:assert/strict';
import test from 'node:test';

import { SeverityClassifier } from '../../src/modules/analysis/risk/SeverityClassifier.js';

test('SeverityClassifier applies configured boundaries', () => {
  const classifier = new SeverityClassifier({ high: 0.7, medium: 0.3 });

  assert.equal(classifier.classify(0.29), 'LOW');
  assert.equal(classifier.classify(0.3), 'MEDIUM');
  assert.equal(classifier.classify(0.69), 'MEDIUM');
  assert.equal(classifier.classify(0.7), 'HIGH');
});

test('SeverityClassifier rejects values outside the normalized range', () => {
  const classifier = new SeverityClassifier({ high: 0.7, medium: 0.3 });

  assert.throws(() => classifier.classify(-0.01), RangeError);
  assert.throws(() => classifier.classify(1.01), RangeError);
});

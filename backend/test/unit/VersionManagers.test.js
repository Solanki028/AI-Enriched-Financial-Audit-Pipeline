import assert from 'node:assert/strict';
import test from 'node:test';

import { ContextVersionManager } from '../../src/modules/analysis/versioning/ContextVersionManager.js';
import { ModelVersionManager } from '../../src/modules/analysis/versioning/ModelVersionManager.js';
import { VersionComparator } from '../../src/modules/analysis/versioning/VersionComparator.js';

test('VersionComparator compares numeric version components', () => {
  const comparator = new VersionComparator();

  assert.equal(comparator.compare('v1.10', 'v1.2'), 1);
  assert.equal(comparator.compare('v2.0', '2'), 0);
  assert.equal(comparator.isOlder('v1.9', 'v2.0'), true);
});

test('ModelVersionManager identifies stale model components', () => {
  const manager = new ModelVersionManager({
    risk: 'v2.0',
    semanticVector: 'v1.1',
  });

  assert.equal(manager.isStale('risk', 'v1.9'), true);
  assert.deepEqual(
    manager.getStaleComponents({
      risk: 'v1.9',
      semanticVector: 'v1.1',
    }),
    ['risk'],
  );
});

test('ContextVersionManager reports current and stale contexts', () => {
  const manager = new ContextVersionManager('v3.0');

  assert.equal(manager.isCurrent('3'), true);
  assert.equal(manager.isStale('v2.9'), true);
});

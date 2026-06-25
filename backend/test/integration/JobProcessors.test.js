import assert from 'node:assert/strict';
import test from 'node:test';

import { ComplianceEvaluator } from '../../src/modules/analysis/compliance/ComplianceEvaluator.js';
import { FullAnalysisPipelineFactory } from '../../src/modules/analysis/pipelines/FullAnalysisPipelineFactory.js';
import { RiskEngineFactory } from '../../src/modules/analysis/risk/RiskEngineFactory.js';
import { ContextVersionManager } from '../../src/modules/analysis/versioning/ContextVersionManager.js';
import { FullAnalysisProcessor } from '../../src/workers/processors/FullAnalysisProcessor.js';
import { ModelMigrationProcessor } from '../../src/workers/processors/ModelMigrationProcessor.js';
import { PartialRiskProcessor } from '../../src/workers/processors/PartialRiskProcessor.js';
import { AnalysisFixture } from '../helpers/AnalysisFixture.js';
import { WorkerTestHarness } from '../helpers/WorkerTestHarness.js';

class EntryRepositoryDouble {
  constructor(entry) {
    this.entry = entry;
  }

  async findById() {
    return this.entry;
  }
}

class AnalysisRepositoryDouble {
  constructor({ persist = true } = {}) {
    this.persist = persist;
    this.fullAnalyses = [];
    this.partialUpdates = [];
    this.migrations = [];
  }

  async saveFullAnalysisIfRevisionMatches(command) {
    this.fullAnalyses.push(command);
    return this.persist;
  }

  async updateRiskAndComplianceIfRevisionMatches(command) {
    this.partialUpdates.push(command);
    return this.persist;
  }

  async saveModelMigrationIfRevisionMatches(command) {
    this.migrations.push(command);
    return this.persist;
  }
}

class ProcessorFactory {
  static fullAnalysis(entry, analysisRepository = new AnalysisRepositoryDouble()) {
    return new FullAnalysisProcessor({
      analysisRepository,
      entryRepository: new EntryRepositoryDouble(entry),
      fullAnalysisPipeline: new FullAnalysisPipelineFactory().create(
        AnalysisFixture.configuration(),
      ),
      modelDelayMs: 0,
    });
  }

  static partialRisk(entry, analysisRepository = new AnalysisRepositoryDouble()) {
    const configuration = AnalysisFixture.configuration();
    const riskEngine = new RiskEngineFactory().create(configuration.risk);

    return new PartialRiskProcessor({
      analysisRepository,
      complianceEvaluator: ComplianceEvaluator.fromConfiguration(configuration.compliance),
      contextVersionManager: new ContextVersionManager(configuration.versioning.context),
      entryRepository: new EntryRepositoryDouble(entry),
      modelDelayMs: 0,
      ...riskEngine,
    });
  }

  static modelMigration(entry, analysisRepository = new AnalysisRepositoryDouble()) {
    return new ModelMigrationProcessor({
      analysisRepository,
      entryRepository: new EntryRepositoryDouble(entry),
      fullAnalysisPipeline: new FullAnalysisPipelineFactory().create(
        AnalysisFixture.configuration(),
      ),
      modelDelayMs: 0,
    });
  }
}

const executionContext = Object.freeze({
  assertLease: async () => undefined,
});

test('FullAnalysisProcessor persists analysis when source revision matches', async () => {
  const entry = AnalysisFixture.normalEntry({ sourceRevision: 1 });
  const repository = new AnalysisRepositoryDouble();
  const processor = ProcessorFactory.fullAnalysis(entry, repository);
  const result = await processor.process(WorkerTestHarness.fullAnalysisCommand(), executionContext);

  assert.equal(result.status, 'completed');
  assert.equal(repository.fullAnalyses.length, 1);
  assert.equal(repository.fullAnalyses[0].analysis.sourceRevision, 1);
});

test('FullAnalysisProcessor returns stale when source revision changed', async () => {
  const entry = AnalysisFixture.normalEntry({ sourceRevision: 2 });
  const repository = new AnalysisRepositoryDouble();
  const processor = ProcessorFactory.fullAnalysis(entry, repository);
  const result = await processor.process(WorkerTestHarness.fullAnalysisCommand(), executionContext);

  assert.equal(result.status, 'stale');
  assert.equal(repository.fullAnalyses.length, 0);
});

test('FullAnalysisProcessor returns stale when optimistic persistence rejects revision', async () => {
  const entry = AnalysisFixture.normalEntry({ sourceRevision: 1 });
  const repository = new AnalysisRepositoryDouble({ persist: false });
  const processor = ProcessorFactory.fullAnalysis(entry, repository);
  const result = await processor.process(WorkerTestHarness.fullAnalysisCommand(), executionContext);

  assert.equal(result.status, 'stale');
  assert.equal(repository.fullAnalyses.length, 1);
});

test('PartialRiskProcessor updates only risk and compliance data', async () => {
  const entry = AnalysisFixture.highRiskEntry({ sourceRevision: 1 });
  const repository = new AnalysisRepositoryDouble();
  const processor = ProcessorFactory.partialRisk(entry, repository);
  const result = await processor.process(WorkerTestHarness.fullAnalysisCommand(), executionContext);

  assert.equal(result.status, 'completed');
  assert.equal(repository.partialUpdates.length, 1);
  assert.equal(repository.partialUpdates[0].update.riskScore, 1);
  assert.equal(repository.partialUpdates[0].update.severity, 'HIGH');
  assert.equal(repository.partialUpdates[0].update.vectors, undefined);
});

test('ModelMigrationProcessor persists migrated analysis with target versions', async () => {
  const entry = AnalysisFixture.normalEntry({ sourceRevision: 1 });
  const repository = new AnalysisRepositoryDouble();
  const processor = ProcessorFactory.modelMigration(entry, repository);
  const result = await processor.process(
    WorkerTestHarness.fullAnalysisCommand({
      payload: {
        targetVersions: {
          risk: 'v2.0',
        },
      },
    }),
    executionContext,
  );

  assert.equal(result.status, 'completed');
  assert.equal(repository.migrations.length, 1);
  assert.deepEqual(repository.migrations[0].targetVersions, { risk: 'v2.0' });
});

import { JobType } from '../../modules/jobs/policies/JobType.js';
import { RevisionProtectedProcessor } from './RevisionProtectedProcessor.js';

export class ModelMigrationProcessor extends RevisionProtectedProcessor {
  constructor({ analysisRepository, entryRepository, fullAnalysisPipeline, modelDelayMs }) {
    super({
      analysisRepository,
      entryRepository,
      jobType: JobType.MODEL_MIGRATION,
      modelDelayMs,
    });
    this.fullAnalysisPipeline = fullAnalysisPipeline;
  }

  async process(job, executionContext) {
    const loaded = await this.loadCurrentEntry(job);

    if (loaded.stale) {
      return Object.freeze({ status: 'stale' });
    }

    await this.simulateModelExecution();
    const analysis = this.fullAnalysisPipeline.analyze(loaded.entry);
    await executionContext.assertLease();
    const persisted = await this.analysisRepository.saveModelMigrationIfRevisionMatches({
      analysis,
      entryId: job.entryId,
      sourceRevision: job.sourceRevision,
      targetVersions: job.payload.targetVersions ?? analysis.modelVersions,
    });

    return Object.freeze({ status: persisted ? 'completed' : 'stale' });
  }
}

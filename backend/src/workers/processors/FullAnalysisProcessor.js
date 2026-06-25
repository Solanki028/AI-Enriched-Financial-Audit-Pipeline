import { JobType } from '../../modules/jobs/policies/JobType.js';
import { RevisionProtectedProcessor } from './RevisionProtectedProcessor.js';

export class FullAnalysisProcessor extends RevisionProtectedProcessor {
  constructor({ analysisRepository, entryRepository, fullAnalysisPipeline, modelDelayMs }) {
    super({
      analysisRepository,
      entryRepository,
      jobType: JobType.FULL_ANALYSIS,
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
    const persisted = await this.analysisRepository.saveFullAnalysisIfRevisionMatches({
      analysis,
      entryId: job.entryId,
      sourceRevision: job.sourceRevision,
    });

    return Object.freeze({ status: persisted ? 'completed' : 'stale' });
  }
}

import { JobType } from '../../modules/jobs/policies/JobType.js';
import { RevisionProtectedProcessor } from './RevisionProtectedProcessor.js';

export class PartialRiskProcessor extends RevisionProtectedProcessor {
  constructor({
    analysisRepository,
    complianceEvaluator,
    contextVersionManager,
    entryRepository,
    modelDelayMs,
    riskCalculator,
    severityClassifier,
  }) {
    super({
      analysisRepository,
      entryRepository,
      jobType: JobType.PARTIAL_RISK,
      modelDelayMs,
    });
    this.complianceEvaluator = complianceEvaluator;
    this.contextVersionManager = contextVersionManager;
    this.riskCalculator = riskCalculator;
    this.severityClassifier = severityClassifier;
  }

  async process(job, executionContext) {
    const loaded = await this.loadCurrentEntry(job);

    if (loaded.stale) {
      return Object.freeze({ status: 'stale' });
    }

    await this.simulateModelExecution();
    const risk = this.riskCalculator.calculate(loaded.entry);
    const update = Object.freeze({
      compliance: this.complianceEvaluator.evaluate(loaded.entry),
      contextVersion: this.contextVersionManager.getVersion(),
      riskScore: risk.riskScore,
      severity: this.severityClassifier.classify(risk.riskScore),
      triggeredRules: risk.triggeredRules,
    });
    await executionContext.assertLease();
    const persisted = await this.analysisRepository.updateRiskAndComplianceIfRevisionMatches({
      entryId: job.entryId,
      sourceRevision: job.sourceRevision,
      update,
    });

    return Object.freeze({ status: persisted ? 'completed' : 'stale' });
  }
}

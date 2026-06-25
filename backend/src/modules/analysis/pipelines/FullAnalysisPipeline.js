import { AnalysisResult } from './AnalysisResult.js';

export class FullAnalysisPipeline {
  constructor({
    anomalyDetector,
    complianceEvaluator,
    contextVersionManager,
    entityVectorGenerator,
    entryNormalizer,
    financialVectorGenerator,
    modelVersionManager,
    riskCalculator,
    semanticVectorGenerator,
    severityClassifier,
  }) {
    this.anomalyDetector = anomalyDetector;
    this.complianceEvaluator = complianceEvaluator;
    this.contextVersionManager = contextVersionManager;
    this.entityVectorGenerator = entityVectorGenerator;
    this.entryNormalizer = entryNormalizer;
    this.financialVectorGenerator = financialVectorGenerator;
    this.modelVersionManager = modelVersionManager;
    this.riskCalculator = riskCalculator;
    this.semanticVectorGenerator = semanticVectorGenerator;
    this.severityClassifier = severityClassifier;
  }

  analyze(sourceEntry) {
    const entry = this.entryNormalizer.normalize(sourceEntry);
    const semantic = this.semanticVectorGenerator.generate(entry);
    const financial = this.financialVectorGenerator.generate(entry);
    const entity = this.entityVectorGenerator.generate(entry);
    const anomalies = this.anomalyDetector.detect(entry);
    const risk = this.riskCalculator.calculate(entry);
    const severity = this.severityClassifier.classify(risk.riskScore);
    const compliance = this.complianceEvaluator.evaluate(entry);

    return new AnalysisResult({
      anomalies,
      compliance,
      contextVersion: this.contextVersionManager.getVersion(),
      entryId: entry._id ?? null,
      modelVersions: this.modelVersionManager.getVersions(),
      riskScore: risk.riskScore,
      severity,
      sourceRevision: entry.sourceRevision ?? null,
      triggeredRules: risk.triggeredRules,
      vectors: Object.freeze({
        entity,
        financial,
        semantic,
      }),
    });
  }
}

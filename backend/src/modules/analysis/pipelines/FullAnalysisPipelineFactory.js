import { AnomalyDetector } from '../anomalies/AnomalyDetector.js';
import { ComplianceEvaluator } from '../compliance/ComplianceEvaluator.js';
import { RiskEngineFactory } from '../risk/RiskEngineFactory.js';
import { ContextVersionManager } from '../versioning/ContextVersionManager.js';
import { ModelVersionManager } from '../versioning/ModelVersionManager.js';
import { VectorEngineFactory } from '../vectors/VectorEngineFactory.js';
import { AnalysisConfiguration } from './AnalysisConfiguration.js';
import { EntryNormalizer } from './EntryNormalizer.js';
import { FullAnalysisPipeline } from './FullAnalysisPipeline.js';

export class FullAnalysisPipelineFactory {
  constructor(
    riskEngineFactory = new RiskEngineFactory(),
    vectorEngineFactory = new VectorEngineFactory(),
  ) {
    this.riskEngineFactory = riskEngineFactory;
    this.vectorEngineFactory = vectorEngineFactory;
  }

  create(rawConfiguration) {
    const configuration = new AnalysisConfiguration(rawConfiguration).value;
    const riskEngine = this.riskEngineFactory.create(configuration.risk);
    const vectorEngine = this.vectorEngineFactory.create(configuration.vectors);

    return new FullAnalysisPipeline({
      anomalyDetector: AnomalyDetector.fromConfiguration(configuration.anomalies),
      complianceEvaluator: ComplianceEvaluator.fromConfiguration(configuration.compliance),
      contextVersionManager: new ContextVersionManager(configuration.versioning.context),
      entryNormalizer: new EntryNormalizer(),
      modelVersionManager: new ModelVersionManager(configuration.versioning.models),
      ...riskEngine,
      ...vectorEngine,
    });
  }
}

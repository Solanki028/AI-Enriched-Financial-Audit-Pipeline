export class AnalysisResult {
  constructor({
    anomalies,
    compliance,
    contextVersion,
    entryId,
    modelVersions,
    riskScore,
    severity,
    sourceRevision,
    triggeredRules,
    vectors,
  }) {
    this.entryId = entryId;
    this.sourceRevision = sourceRevision;
    this.riskScore = riskScore;
    this.severity = severity;
    this.triggeredRules = triggeredRules;
    this.anomalies = anomalies;
    this.compliance = compliance;
    this.vectors = vectors;
    this.modelVersions = modelVersions;
    this.contextVersion = contextVersion;
    this.#deepFreeze(this);
  }

  #deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) {
        this.#deepFreeze(child);
      }

      Object.freeze(value);
    }
  }
}

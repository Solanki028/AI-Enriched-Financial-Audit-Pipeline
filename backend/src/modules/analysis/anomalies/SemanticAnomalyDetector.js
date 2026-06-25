export class SemanticAnomalyDetector {
  constructor({ severity, suspiciousTerms }) {
    this.severity = severity;
    this.suspiciousTerms = Object.freeze(suspiciousTerms.map((term) => term.toLowerCase()));
    Object.freeze(this);
  }

  detect(entry) {
    const normalizedDescription = entry.description.toLowerCase();
    const matchedTerms = this.suspiciousTerms.filter((term) =>
      normalizedDescription.includes(term),
    );

    if (matchedTerms.length === 0) {
      return null;
    }

    return Object.freeze({
      field: 'description',
      message: 'Description contains one or more configured suspicious terms.',
      metadata: Object.freeze({
        matchedTerms: Object.freeze(matchedTerms),
      }),
      severity: this.severity,
      type: 'semantic_anomaly',
    });
  }
}

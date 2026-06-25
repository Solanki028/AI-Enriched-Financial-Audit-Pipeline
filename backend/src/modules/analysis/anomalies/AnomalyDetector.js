import { DebitCreditMismatchDetector } from './DebitCreditMismatchDetector.js';
import { NumericOutlierDetector } from './NumericOutlierDetector.js';
import { SemanticAnomalyDetector } from './SemanticAnomalyDetector.js';
import { UnusualPostingTimeDetector } from './UnusualPostingTimeDetector.js';

export class AnomalyDetector {
  constructor(detectors) {
    if (!Array.isArray(detectors) || detectors.length === 0) {
      throw new TypeError('AnomalyDetector requires at least one field detector.');
    }

    this.detectors = Object.freeze([...detectors]);
  }

  detect(entry) {
    const anomalies = this.detectors
      .map((detector) => detector.detect(entry))
      .filter((anomaly) => anomaly !== null);

    return Object.freeze(anomalies);
  }

  static fromConfiguration(configuration) {
    return new AnomalyDetector([
      new DebitCreditMismatchDetector({
        severity: configuration.severityByType.debit_credit_mismatch,
        tolerance: configuration.balanceTolerance,
      }),
      new NumericOutlierDetector({
        severity: configuration.severityByType.numeric_outlier,
        threshold: configuration.amountOutlierThreshold,
      }),
      new SemanticAnomalyDetector({
        severity: configuration.severityByType.semantic_anomaly,
        suspiciousTerms: configuration.suspiciousTerms,
      }),
      new UnusualPostingTimeDetector({
        ...configuration.unusualPostingTime,
        severity: configuration.severityByType.unusual_posting_time,
      }),
    ]);
  }
}

export class NumericOutlierDetector {
  constructor({ severity, threshold }) {
    this.severity = severity;
    this.threshold = threshold;
    Object.freeze(this);
  }

  detect(entry) {
    const absoluteAmount = Math.abs(entry.amount);

    if (absoluteAmount < this.threshold) {
      return null;
    }

    return Object.freeze({
      field: 'amount',
      message: 'Transaction amount exceeds the configured numeric outlier threshold.',
      metadata: Object.freeze({
        absoluteAmount,
        threshold: this.threshold,
      }),
      severity: this.severity,
      type: 'numeric_outlier',
    });
  }
}

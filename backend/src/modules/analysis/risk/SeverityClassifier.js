export class SeverityClassifier {
  constructor({ medium, high }) {
    this.mediumThreshold = medium;
    this.highThreshold = high;
  }

  classify(riskScore) {
    if (!Number.isFinite(riskScore) || riskScore < 0 || riskScore > 1) {
      throw new RangeError('Risk score must be a finite number between 0 and 1.');
    }

    if (riskScore >= this.highThreshold) {
      return 'HIGH';
    }

    if (riskScore >= this.mediumThreshold) {
      return 'MEDIUM';
    }

    return 'LOW';
  }
}

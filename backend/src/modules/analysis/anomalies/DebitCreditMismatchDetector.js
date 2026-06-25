export class DebitCreditMismatchDetector {
  constructor({ severity, tolerance }) {
    this.severity = severity;
    this.tolerance = tolerance;
    Object.freeze(this);
  }

  detect(entry) {
    const difference = Math.abs(entry.debit - entry.credit);

    if (difference <= this.tolerance) {
      return null;
    }

    return Object.freeze({
      field: 'debit,credit',
      message: 'Debit and credit values do not balance within the configured tolerance.',
      metadata: Object.freeze({
        credit: entry.credit,
        debit: entry.debit,
        difference,
        tolerance: this.tolerance,
      }),
      severity: this.severity,
      type: 'debit_credit_mismatch',
    });
  }
}

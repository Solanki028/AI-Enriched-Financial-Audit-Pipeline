export class PositiveAmountComplianceRule {
  constructor(required) {
    this.required = required;
    Object.freeze(this);
  }

  evaluate(entry) {
    if (!this.required || entry.amount > 0) {
      return Object.freeze({ violations: Object.freeze([]), warnings: Object.freeze([]) });
    }

    return Object.freeze({
      violations: Object.freeze([
        Object.freeze({
          code: 'amount_not_positive',
          fields: Object.freeze(['amount']),
          message: 'Transaction amount must be positive.',
          metadata: Object.freeze({ amount: entry.amount }),
        }),
      ]),
      warnings: Object.freeze([]),
    });
  }
}

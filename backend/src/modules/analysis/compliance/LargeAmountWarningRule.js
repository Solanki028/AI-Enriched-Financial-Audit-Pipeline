export class LargeAmountWarningRule {
  constructor(threshold) {
    this.threshold = threshold;
    Object.freeze(this);
  }

  evaluate(entry) {
    const absoluteAmount = Math.abs(entry.amount);

    if (absoluteAmount < this.threshold) {
      return Object.freeze({ violations: Object.freeze([]), warnings: Object.freeze([]) });
    }

    return Object.freeze({
      violations: Object.freeze([]),
      warnings: Object.freeze([
        Object.freeze({
          code: 'large_amount_review',
          fields: Object.freeze(['amount']),
          message: 'Transaction amount requires additional review.',
          metadata: Object.freeze({
            absoluteAmount,
            threshold: this.threshold,
          }),
        }),
      ]),
    });
  }
}

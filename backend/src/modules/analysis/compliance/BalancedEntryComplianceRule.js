export class BalancedEntryComplianceRule {
  constructor(balanceTolerance) {
    this.balanceTolerance = balanceTolerance;
    Object.freeze(this);
  }

  evaluate(entry) {
    const difference = Math.abs(entry.debit - entry.credit);

    if (difference <= this.balanceTolerance) {
      return Object.freeze({ violations: Object.freeze([]), warnings: Object.freeze([]) });
    }

    return Object.freeze({
      violations: Object.freeze([
        Object.freeze({
          code: 'entry_not_balanced',
          fields: Object.freeze(['debit', 'credit']),
          message: 'Debit and credit values do not balance.',
          metadata: Object.freeze({
            difference,
            tolerance: this.balanceTolerance,
          }),
        }),
      ]),
      warnings: Object.freeze([]),
    });
  }
}

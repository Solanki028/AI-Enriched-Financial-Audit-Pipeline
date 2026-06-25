export class DebitCreditMismatchRule {
  constructor(configuration) {
    this.id = 'debit_credit_mismatch';
    this.enabled = configuration.enabled;
    this.weight = configuration.weight;
    this.tolerance = configuration.tolerance;
    Object.freeze(this);
  }

  evaluate(entry) {
    const difference = Math.abs(entry.debit - entry.credit);

    return Object.freeze({
      fields: Object.freeze(['debit', 'credit']),
      metadata: Object.freeze({
        credit: entry.credit,
        debit: entry.debit,
        difference,
        tolerance: this.tolerance,
      }),
      triggered: difference > this.tolerance,
    });
  }
}

export class LargeAmountRule {
  constructor(configuration) {
    this.id = 'unusually_large_amount';
    this.enabled = configuration.enabled;
    this.weight = configuration.weight;
    this.threshold = configuration.threshold;
    Object.freeze(this);
  }

  evaluate(entry) {
    const absoluteAmount = Math.abs(entry.amount);

    return Object.freeze({
      fields: Object.freeze(['amount']),
      metadata: Object.freeze({
        absoluteAmount,
        threshold: this.threshold,
      }),
      triggered: absoluteAmount >= this.threshold,
    });
  }
}

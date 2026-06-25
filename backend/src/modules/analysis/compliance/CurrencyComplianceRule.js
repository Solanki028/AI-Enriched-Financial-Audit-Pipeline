export class CurrencyComplianceRule {
  constructor(allowedCurrencies) {
    this.allowedCurrencies = new Set(allowedCurrencies.map((currency) => currency.toUpperCase()));
  }

  evaluate(entry) {
    const currency = String(entry.currency ?? '').toUpperCase();

    if (this.allowedCurrencies.has(currency)) {
      return Object.freeze({ violations: Object.freeze([]), warnings: Object.freeze([]) });
    }

    return Object.freeze({
      violations: Object.freeze([
        Object.freeze({
          code: 'currency_not_allowed',
          fields: Object.freeze(['currency']),
          message: 'Transaction currency is not allowed by the configured accounting context.',
          metadata: Object.freeze({ currency }),
        }),
      ]),
      warnings: Object.freeze([]),
    });
  }
}

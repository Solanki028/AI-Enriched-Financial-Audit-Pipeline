export class RiskCalculator {
  constructor({ rules, severityClassifier, precision }) {
    if (!Array.isArray(rules) || rules.length === 0) {
      throw new TypeError('RiskCalculator requires at least one risk rule.');
    }

    if (!severityClassifier || typeof severityClassifier.classify !== 'function') {
      throw new TypeError('RiskCalculator requires a SeverityClassifier.');
    }

    if (!Number.isSafeInteger(precision) || precision < 0) {
      throw new TypeError('RiskCalculator precision must be a non-negative integer.');
    }

    this.rules = Object.freeze([...rules]);
    this.severityClassifier = severityClassifier;
    this.precision = precision;
  }

  calculate(entry) {
    const enabledRules = this.rules.filter((rule) => rule.enabled);
    const totalWeight = enabledRules.reduce((total, rule) => total + rule.weight, 0);

    if (totalWeight <= 0) {
      throw new RangeError('Enabled risk rules must have a positive total weight.');
    }

    const triggeredRules = [];
    let triggeredWeight = 0;

    for (const rule of enabledRules) {
      const evaluation = rule.evaluate(entry);

      if (evaluation.triggered) {
        triggeredWeight += rule.weight;
        triggeredRules.push(
          Object.freeze({
            fields: evaluation.fields,
            metadata: evaluation.metadata,
            rule: rule.id,
            weight: rule.weight,
          }),
        );
      }
    }

    const riskScore = this.#round(Math.min(Math.max(triggeredWeight / totalWeight, 0), 1));

    return Object.freeze({
      riskScore,
      severity: this.severityClassifier.classify(riskScore),
      triggeredRules: Object.freeze(triggeredRules),
    });
  }

  #round(value) {
    const scale = 10 ** this.precision;
    return Math.round(value * scale) / scale;
  }
}

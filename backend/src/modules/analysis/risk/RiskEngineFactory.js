import { DebitCreditMismatchRule } from './DebitCreditMismatchRule.js';
import { LargeAmountRule } from './LargeAmountRule.js';
import { RiskCalculator } from './RiskCalculator.js';
import { SeverityClassifier } from './SeverityClassifier.js';
import { SuspiciousDescriptionRule } from './SuspiciousDescriptionRule.js';
import { UnusualPostingTimeRule } from './UnusualPostingTimeRule.js';

export class RiskEngineFactory {
  create(configuration) {
    const severityClassifier = new SeverityClassifier(configuration.severityThresholds);
    const rules = [
      new DebitCreditMismatchRule(configuration.rules.debitCreditMismatch),
      new UnusualPostingTimeRule(configuration.rules.unusualPostingTime),
      new LargeAmountRule(configuration.rules.largeAmount),
      new SuspiciousDescriptionRule(configuration.rules.suspiciousDescription),
    ];

    return Object.freeze({
      riskCalculator: new RiskCalculator({
        precision: configuration.scorePrecision,
        rules,
        severityClassifier,
      }),
      severityClassifier,
    });
  }
}

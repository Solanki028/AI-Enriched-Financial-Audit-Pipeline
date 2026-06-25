import { BalancedEntryComplianceRule } from './BalancedEntryComplianceRule.js';
import { CurrencyComplianceRule } from './CurrencyComplianceRule.js';
import { LargeAmountWarningRule } from './LargeAmountWarningRule.js';
import { PositiveAmountComplianceRule } from './PositiveAmountComplianceRule.js';
import { RequiredFieldsComplianceRule } from './RequiredFieldsComplianceRule.js';

export class ComplianceEvaluator {
  constructor(rules) {
    if (!Array.isArray(rules) || rules.length === 0) {
      throw new TypeError('ComplianceEvaluator requires at least one compliance rule.');
    }

    this.rules = Object.freeze([...rules]);
  }

  evaluate(entry) {
    const violations = [];
    const warnings = [];

    for (const rule of this.rules) {
      const result = rule.evaluate(entry);
      violations.push(...result.violations);
      warnings.push(...result.warnings);
    }

    return Object.freeze({
      compliant: violations.length === 0,
      violations: Object.freeze(violations),
      warnings: Object.freeze(warnings),
    });
  }

  static fromConfiguration(configuration) {
    return new ComplianceEvaluator([
      new RequiredFieldsComplianceRule(configuration.requiredFields),
      new BalancedEntryComplianceRule(configuration.balanceTolerance),
      new CurrencyComplianceRule(configuration.allowedCurrencies),
      new PositiveAmountComplianceRule(configuration.requirePositiveAmount),
      new LargeAmountWarningRule(configuration.largeAmountWarningThreshold),
    ]);
  }
}

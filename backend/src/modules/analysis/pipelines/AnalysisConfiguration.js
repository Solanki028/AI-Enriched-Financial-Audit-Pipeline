import { AnalysisConfigurationError } from '../errors/AnalysisConfigurationError.js';

export class AnalysisConfiguration {
  static MAX_SCORE_PRECISION = 12;
  constructor(configuration) {
    this.value = this.#validate(configuration);
    Object.freeze(this);
  }

  #validate(configuration) {
    this.#requireObject(configuration, 'analysis configuration');
    this.#validateRisk(configuration.risk);
    this.#validateAnomalies(configuration.anomalies);
    this.#validateVectors(configuration.vectors);
    this.#validateCompliance(configuration.compliance);
    this.#validateVersioning(configuration.versioning);

    return this.#deepFreeze(structuredClone(configuration));
  }

  #validateRisk(risk) {
    this.#requireObject(risk, 'risk configuration');
    this.#requireIntegerInRange(
      risk.scorePrecision,
      'risk.scorePrecision',
      0,
      AnalysisConfiguration.MAX_SCORE_PRECISION,
    );
    this.#requireObject(risk.severityThresholds, 'risk.severityThresholds');
    this.#requireUnitInterval(risk.severityThresholds?.medium, 'risk.severityThresholds.medium');
    this.#requireUnitInterval(risk.severityThresholds?.high, 'risk.severityThresholds.high');

    if (risk.severityThresholds.medium >= risk.severityThresholds.high) {
      throw new AnalysisConfigurationError(
        'Medium severity threshold must be lower than high severity threshold.',
      );
    }

    this.#requireObject(risk.rules, 'risk.rules');

    for (const [ruleName, rule] of Object.entries(risk.rules)) {
      this.#requireObject(rule, `risk.rules.${ruleName}`);
      this.#requireBoolean(rule.enabled, `risk.rules.${ruleName}.enabled`);
      this.#requirePositiveNumber(rule.weight, `risk.rules.${ruleName}.weight`);
    }

    this.#requireNonNegativeNumber(
      risk.rules.debitCreditMismatch?.tolerance,
      'risk.rules.debitCreditMismatch.tolerance',
    );
    this.#requirePositiveNumber(
      risk.rules.largeAmount?.threshold,
      'risk.rules.largeAmount.threshold',
    );
    this.#validateTimeWindow(risk.rules.unusualPostingTime, 'risk.rules.unusualPostingTime');
    this.#requireStringArray(
      risk.rules.suspiciousDescription?.terms,
      'risk.rules.suspiciousDescription.terms',
    );
  }

  #validateAnomalies(anomalies) {
    this.#requireObject(anomalies, 'anomalies configuration');
    this.#requireNonNegativeNumber(anomalies.balanceTolerance, 'anomalies.balanceTolerance');
    this.#requirePositiveNumber(
      anomalies.amountOutlierThreshold,
      'anomalies.amountOutlierThreshold',
    );
    this.#validateTimeWindow(anomalies.unusualPostingTime, 'anomalies.unusualPostingTime');
    this.#requireStringArray(anomalies.suspiciousTerms, 'anomalies.suspiciousTerms');
    this.#requireObject(anomalies.severityByType, 'anomalies.severityByType');

    const requiredTypes = [
      'debit_credit_mismatch',
      'numeric_outlier',
      'semantic_anomaly',
      'unusual_posting_time',
    ];

    for (const type of requiredTypes) {
      const severity = anomalies.severityByType[type];
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(severity)) {
        throw new AnalysisConfigurationError(
          `anomalies.severityByType.${type} must be LOW, MEDIUM, or HIGH.`,
        );
      }
    }
  }

  #validateVectors(vectors) {
    this.#requireObject(vectors, 'vectors configuration');
    this.#requirePositiveInteger(vectors.semanticLength, 'vectors.semanticLength');
    this.#requirePositiveInteger(vectors.financialLength, 'vectors.financialLength');
    this.#requirePositiveInteger(vectors.entityLength, 'vectors.entityLength');
    this.#requirePositiveNumber(vectors.amountScale, 'vectors.amountScale');
    this.#requirePositiveNumber(vectors.glNumberScale, 'vectors.glNumberScale');
  }

  #validateCompliance(compliance) {
    this.#requireObject(compliance, 'compliance configuration');
    this.#requireNonNegativeNumber(compliance.balanceTolerance, 'compliance.balanceTolerance');
    this.#requireBoolean(compliance.requirePositiveAmount, 'compliance.requirePositiveAmount');
    this.#requireStringArray(compliance.requiredFields, 'compliance.requiredFields');
    this.#requireStringArray(compliance.allowedCurrencies, 'compliance.allowedCurrencies');
    this.#requirePositiveNumber(
      compliance.largeAmountWarningThreshold,
      'compliance.largeAmountWarningThreshold',
    );
  }

  #validateVersioning(versioning) {
    this.#requireObject(versioning, 'versioning configuration');
    this.#requireVersion(versioning.context, 'versioning.context');
    this.#requireObject(versioning.models, 'versioning.models');

    if (Object.keys(versioning.models).length === 0) {
      throw new AnalysisConfigurationError('versioning.models must not be empty.');
    }

    for (const [component, version] of Object.entries(versioning.models)) {
      this.#requireVersion(version, `versioning.models.${component}`);
    }
  }

  #validateTimeWindow(configuration, path) {
    this.#requireObject(configuration, path);
    this.#requireIntegerInRange(configuration.startHour, `${path}.startHour`, 0, 23);
    this.#requireIntegerInRange(configuration.endHour, `${path}.endHour`, 0, 23);

    if (!Array.isArray(configuration.weekendDays) || configuration.weekendDays.length === 0) {
      throw new AnalysisConfigurationError(`${path}.weekendDays must be a non-empty array.`);
    }

    for (const day of configuration.weekendDays) {
      this.#requireIntegerInRange(day, `${path}.weekendDays`, 0, 6);
    }
  }

  #requireObject(value, path) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new AnalysisConfigurationError(`${path} must be an object.`);
    }
  }

  #requireBoolean(value, path) {
    if (typeof value !== 'boolean') {
      throw new AnalysisConfigurationError(`${path} must be a boolean.`);
    }
  }

  #requirePositiveInteger(value, path) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new AnalysisConfigurationError(`${path} must be a positive integer.`);
    }
  }

  #requireIntegerInRange(value, path, minimum, maximum) {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new AnalysisConfigurationError(
        `${path} must be an integer between ${minimum} and ${maximum}.`,
      );
    }
  }

  #requirePositiveNumber(value, path) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new AnalysisConfigurationError(`${path} must be a positive number.`);
    }
  }

  #requireNonNegativeNumber(value, path) {
    if (!Number.isFinite(value) || value < 0) {
      throw new AnalysisConfigurationError(`${path} must be a non-negative number.`);
    }
  }

  #requireUnitInterval(value, path) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new AnalysisConfigurationError(`${path} must be between 0 and 1.`);
    }
  }

  #requireStringArray(value, path) {
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== 'string' || item.trim().length === 0)
    ) {
      throw new AnalysisConfigurationError(`${path} must be an array of non-empty strings.`);
    }
  }

  #requireVersion(value, path) {
    if (typeof value !== 'string' || !/^v?\d+(?:\.\d+)*$/iu.test(value.trim())) {
      throw new AnalysisConfigurationError(
        `${path} must contain dot-separated numeric version components.`,
      );
    }
  }

  #deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);

      for (const child of Object.values(value)) {
        this.#deepFreeze(child);
      }
    }

    return value;
  }
}

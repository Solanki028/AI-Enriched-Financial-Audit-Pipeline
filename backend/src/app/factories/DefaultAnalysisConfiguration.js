export class DefaultAnalysisConfiguration {
  static create() {
    return Object.freeze({
      anomalies: {
        amountOutlierThreshold: 100000,
        balanceTolerance: 0.01,
        severityByType: {
          debit_credit_mismatch: 'HIGH',
          numeric_outlier: 'MEDIUM',
          semantic_anomaly: 'MEDIUM',
          unusual_posting_time: 'MEDIUM',
        },
        suspiciousTerms: ['manual override', 'urgent payment', 'suspicious', 'fraud'],
        unusualPostingTime: {
          endHour: 5,
          startHour: 0,
          weekendDays: [0, 6],
        },
      },
      compliance: {
        allowedCurrencies: ['INR', 'USD', 'EUR', 'GBP'],
        balanceTolerance: 0.01,
        largeAmountWarningThreshold: 100000,
        requirePositiveAmount: true,
        requiredFields: [
          'companyId',
          'accountId',
          'currency',
          'description',
          'debit',
          'credit',
          'transactionDate',
        ],
      },
      risk: {
        rules: {
          debitCreditMismatch: {
            enabled: true,
            tolerance: 0.01,
            weight: 0.4,
          },
          largeAmount: {
            enabled: true,
            threshold: 100000,
            weight: 0.25,
          },
          suspiciousDescription: {
            enabled: true,
            terms: ['manual override', 'urgent payment', 'suspicious', 'fraud'],
            weight: 0.15,
          },
          unusualPostingTime: {
            enabled: true,
            endHour: 5,
            startHour: 0,
            weekendDays: [0, 6],
            weight: 0.2,
          },
        },
        scorePrecision: 4,
        severityThresholds: {
          high: 0.7,
          medium: 0.3,
        },
      },
      vectors: {
        amountScale: 1000000,
        entityLength: 8,
        financialLength: 8,
        glNumberScale: 999999,
        semanticLength: 8,
      },
      versioning: {
        context: 'v1.0',
        models: {
          anomaly: 'v1.0',
          compliance: 'v1.0',
          entityVector: 'v1.0',
          financialVector: 'v1.0',
          risk: 'v1.0',
          semanticVector: 'v1.0',
        },
      },
    });
  }
}

export class AnalysisFixture {
  static configuration(overrides = {}) {
    const baseConfiguration = {
      anomalies: {
        amountOutlierThreshold: 100000,
        balanceTolerance: 0.01,
        severityByType: {
          debit_credit_mismatch: 'HIGH',
          numeric_outlier: 'MEDIUM',
          semantic_anomaly: 'MEDIUM',
          unusual_posting_time: 'MEDIUM',
        },
        suspiciousTerms: ['manual override', 'urgent payment'],
        unusualPostingTime: {
          endHour: 5,
          startHour: 0,
          weekendDays: [0, 6],
        },
      },
      compliance: {
        allowedCurrencies: ['INR', 'USD'],
        balanceTolerance: 0.01,
        largeAmountWarningThreshold: 100000,
        requirePositiveAmount: true,
        requiredFields: [
          'postingDate',
          'transactionType',
          'entryNo',
          'description',
          'currency',
          'glNumber',
          'companyId',
          'userId',
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
            terms: ['manual override', 'urgent payment'],
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
    };

    return structuredClone({
      ...baseConfiguration,
      ...overrides,
    });
  }

  static normalEntry(overrides = {}) {
    return {
      _id: 'entry-normal',
      amount: 1000,
      companyId: 'company-1',
      credit: 1000,
      currency: 'INR',
      debit: 1000,
      description: 'Purchase of raw materials for production',
      entryNo: 'JE-1001',
      glNumber: '400120',
      name: 'ABC Traders Pvt Ltd',
      postingBy: 'user-8392',
      postingDate: '2026-06-22T10:30:00.000Z',
      sourceId: 'upload-91',
      sourceRevision: 3,
      transactionType: 'Journal Entry',
      uploadId: 'file-22',
      userId: 'user-1',
      ...overrides,
    };
  }

  static highRiskEntry(overrides = {}) {
    return this.normalEntry({
      _id: 'entry-high-risk',
      amount: 250000,
      credit: 0,
      debit: 250000,
      description: 'Urgent payment with manual override',
      postingDate: '2026-06-21T02:00:00.000Z',
      ...overrides,
    });
  }
}

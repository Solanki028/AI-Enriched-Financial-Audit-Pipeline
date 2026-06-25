export class EntryResponseSerializer {
  serializeDashboardItem(record) {
    return {
      amount: record.amount,
      companyId: record.companyId,
      currency: record.currency,
      description: record.description,
      entryId: record.entryId,
      processingStatus: record.processingStatus,
      riskScore: record.riskScore,
      severity: record.severity,
      sourceRevision: record.sourceRevision,
      transactionDate: record.transactionDate,
    };
  }

  serializeEntryDetail({ analysis, entry, processingStatus }) {
    return {
      analysis,
      entry,
      processingStatus,
      sourceRevision: entry.sourceRevision,
    };
  }
}

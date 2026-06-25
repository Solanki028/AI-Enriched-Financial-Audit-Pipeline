export class EntryChangeClassifier {
  static FULL_ANALYSIS_FIELDS = Object.freeze([
    'accountId',
    'amount',
    'companyId',
    'credit',
    'currency',
    'debit',
    'description',
    'postingDate',
    'transactionDate',
  ]);

  static PARTIAL_ANALYSIS_FIELDS = Object.freeze(['category', 'counterpartyId', 'riskOverride']);

  classify(changedFields) {
    const fullAnalysisFields = changedFields.filter((field) =>
      EntryChangeClassifier.FULL_ANALYSIS_FIELDS.includes(field),
    );
    const partialAnalysisFields = changedFields.filter((field) =>
      EntryChangeClassifier.PARTIAL_ANALYSIS_FIELDS.includes(field),
    );

    if (fullAnalysisFields.length > 0) {
      return Object.freeze({
        changedFields,
        fields: fullAnalysisFields,
        type: 'full_analysis_required',
      });
    }

    if (partialAnalysisFields.length > 0) {
      return Object.freeze({
        changedFields,
        fields: partialAnalysisFields,
        type: 'partial_analysis_required',
      });
    }

    return Object.freeze({ changedFields, fields: changedFields, type: 'metadata_only' });
  }
}

import { AnalysisInputError } from '../errors/AnalysisInputError.js';

export class EntryNormalizer {
  normalize(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new AnalysisInputError('A journal entry plain object is required.');
    }

    return Object.freeze({
      ...entry,
      amount: this.#toFiniteNumber(entry.amount ?? entry.debit ?? entry.credit ?? 0, 'amount'),
      credit: this.#toFiniteNumber(entry.credit ?? 0, 'credit'),
      debit: this.#toFiniteNumber(entry.debit ?? 0, 'debit'),
      description: this.#toString(entry.description),
      postingDate: this.#toIsoDate(entry.postingDate ?? entry.transactionDate ?? entry.createdAt),
    });
  }

  #toFiniteNumber(value, field) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      throw new AnalysisInputError(`Journal entry field ${field} must be a finite number.`);
    }

    return numericValue;
  }

  #toIsoDate(value) {
    if (typeof value === 'string' && !/(?:Z|[+-]\d{2}:?\d{2})$/u.test(value.trim())) {
      throw new AnalysisInputError(
        'Journal entry field postingDate must include an explicit timezone.',
      );
    }

    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new AnalysisInputError('Journal entry field postingDate must be a valid date.');
    }

    return date.toISOString();
  }

  #toString(value) {
    return typeof value === 'string' ? value.trim() : '';
  }
}

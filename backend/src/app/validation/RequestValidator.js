import { RequestValidationError } from './RequestValidationError.js';

export class RequestValidator {
  constructor({ allowedSortFields = [], enumFields = {}, requiredFields = [] } = {}) {
    this.allowedSortFields = allowedSortFields;
    this.enumFields = enumFields;
    this.requiredFields = requiredFields;
  }

  validateBody(body) {
    const errors = [];

    for (const field of this.requiredFields) {
      if (body?.[field] === undefined || body?.[field] === null || body?.[field] === '') {
        errors.push({ field, message: field + ' is required.' });
      }
    }

    for (const [field, values] of Object.entries(this.enumFields)) {
      const value = body?.[field];
      if (value !== undefined && !values.includes(value)) {
        errors.push({ field, message: field + ' must be one of: ' + values.join(', ') + '.' });
      }
    }

    this.#throwIfInvalid(errors);
    return body;
  }

  validateIdParams(params, keys = ['id']) {
    const errors = [];

    for (const key of keys) {
      if (typeof params?.[key] !== 'string' || params[key].trim().length === 0) {
        errors.push({ field: key, message: key + ' is required.' });
      }
    }

    this.#throwIfInvalid(errors);
    return params;
  }

  validateListQuery(query) {
    const errors = [];
    const page = this.#integer(query.page, 'page', errors, { defaultValue: 1, minimum: 1 });
    const pageSize = this.#integer(query.pageSize, 'pageSize', errors, {
      defaultValue: 25,
      maximum: 100,
      minimum: 1,
    });
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDirection = query.sortDirection ?? 'desc';

    if (this.allowedSortFields.length > 0 && !this.allowedSortFields.includes(sortBy)) {
      errors.push({
        field: 'sortBy',
        message: 'sortBy must be one of: ' + this.allowedSortFields.join(', ') + '.',
      });
    }

    if (!['asc', 'desc'].includes(sortDirection)) {
      errors.push({ field: 'sortDirection', message: 'sortDirection must be asc or desc.' });
    }

    this.#throwIfInvalid(errors);

    return {
      filters: {
        companyId: query.companyId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        processingStatus: query.processingStatus,
        riskMax: query.riskMax === undefined ? undefined : Number(query.riskMax),
        riskMin: query.riskMin === undefined ? undefined : Number(query.riskMin),
        severity: query.severity,
      },
      page,
      pageSize,
      sortBy,
      sortDirection,
    };
  }

  #integer(value, field, errors, { defaultValue, maximum = Number.MAX_SAFE_INTEGER, minimum = 0 }) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
      errors.push({
        field,
        message: field + ' must be an integer between ' + minimum + ' and ' + maximum + '.',
      });
      return defaultValue;
    }

    return parsed;
  }

  #throwIfInvalid(errors) {
    if (errors.length > 0) {
      throw new RequestValidationError(errors);
    }
  }
}

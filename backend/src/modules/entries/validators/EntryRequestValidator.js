import { RequestValidator } from '../../../app/validation/RequestValidator.js';

export class EntryRequestValidator {
  constructor() {
    this.createValidator = new RequestValidator({
      requiredFields: [
        'companyId',
        'accountId',
        'currency',
        'description',
        'debit',
        'credit',
        'transactionDate',
      ],
    });
    this.listValidator = new RequestValidator({
      allowedSortFields: ['createdAt', 'transactionDate', 'riskScore', 'severity', 'companyId'],
    });
    this.paramValidator = new RequestValidator();
  }

  validateCreate(request) {
    return this.createValidator.validateBody(request.body);
  }

  validateUpdate(request) {
    this.paramValidator.validateIdParams(request.params);
    return { changes: request.body, entryId: request.params.id };
  }

  validateGet(request) {
    this.paramValidator.validateIdParams(request.params);
    return request.params.id;
  }

  validateList(request) {
    return this.listValidator.validateListQuery(request.query);
  }
}

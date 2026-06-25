import { RequestValidator } from '../../../app/validation/RequestValidator.js';

export class SimilarityRequestValidator {
  constructor() {
    this.validator = new RequestValidator({
      enumFields: { strategy: ['semantic', 'financial', 'entity'] },
      requiredFields: ['entryId', 'strategy'],
    });
  }

  validateSearch(request) {
    return this.validator.validateBody(request.body);
  }
}

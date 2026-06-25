import { RequestValidator } from '../../../app/validation/RequestValidator.js';

export class AdministrationRequestValidator {
  constructor() {
    this.validator = new RequestValidator();
  }

  validateModelMigration(request) {
    return this.validator.validateBody(request.body);
  }

  validatePartialRisk(request) {
    return this.validator.validateBody(request.body);
  }
}

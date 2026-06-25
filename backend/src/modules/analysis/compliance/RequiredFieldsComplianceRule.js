export class RequiredFieldsComplianceRule {
  constructor(requiredFields) {
    this.requiredFields = Object.freeze([...requiredFields]);
    Object.freeze(this);
  }

  evaluate(entry) {
    const missingFields = this.requiredFields.filter((field) => {
      const value = entry[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length === 0) {
      return Object.freeze({ violations: Object.freeze([]), warnings: Object.freeze([]) });
    }

    return Object.freeze({
      violations: Object.freeze([
        Object.freeze({
          code: 'required_fields_missing',
          fields: Object.freeze(missingFields),
          message: 'One or more required accounting fields are missing.',
          metadata: Object.freeze({ missingFields: Object.freeze(missingFields) }),
        }),
      ]),
      warnings: Object.freeze([]),
    });
  }
}

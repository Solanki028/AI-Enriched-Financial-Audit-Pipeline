export class SuspiciousDescriptionRule {
  constructor(configuration) {
    this.id = 'suspicious_description';
    this.enabled = configuration.enabled;
    this.weight = configuration.weight;
    this.terms = Object.freeze(configuration.terms.map((term) => term.toLowerCase()));
    Object.freeze(this);
  }

  evaluate(entry) {
    const normalizedDescription = entry.description.toLowerCase();
    const matchedTerms = this.terms.filter((term) => normalizedDescription.includes(term));

    return Object.freeze({
      fields: Object.freeze(['description']),
      metadata: Object.freeze({
        matchedTerms: Object.freeze(matchedTerms),
      }),
      triggered: matchedTerms.length > 0,
    });
  }
}

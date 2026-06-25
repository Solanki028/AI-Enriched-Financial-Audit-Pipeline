export class FakeMongoCollection {
  constructor() {
    this.documents = [];
    this.indexes = [];
  }

  async createIndexes(indexes) {
    this.indexes.push(...indexes);
    return indexes.map((index) => index.name);
  }

  async insertOne(document) {
    if (this.documents.some((item) => item.jobId === document.jobId)) {
      throw Object.assign(new Error('Duplicate jobId.'), { code: 11000 });
    }

    if (
      document.activeKey &&
      this.documents.some((item) => item.activeKey && item.activeKey === document.activeKey)
    ) {
      throw Object.assign(new Error('Duplicate activeKey.'), { code: 11000 });
    }

    this.documents.push(this.#clone(document));
    return { acknowledged: true, insertedId: document.jobId };
  }

  async findOne(filter) {
    const document = this.documents.find((item) => this.#matches(item, filter));
    return document ? this.#clone(document) : null;
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const candidates = this.documents.filter((item) => this.#matches(item, filter));

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((left, right) => this.#compare(left, right, options.sort ?? {}));
    const selected = candidates[0];
    this.#applyUpdate(selected, update);
    return this.#clone(selected);
  }

  async updateOne(filter, update) {
    const document = this.documents.find((item) => this.#matches(item, filter));

    if (!document) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    this.#applyUpdate(document, update);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter, update) {
    let matchedCount = 0;

    for (const document of this.documents) {
      if (this.#matches(document, filter)) {
        this.#applyUpdate(document, update);
        matchedCount += 1;
      }
    }

    return { matchedCount, modifiedCount: matchedCount };
  }

  async countDocuments(filter) {
    return this.documents.filter((item) => this.#matches(item, filter)).length;
  }

  allDocuments() {
    return this.#clone(this.documents);
  }

  #applyUpdate(document, update) {
    for (const [field, value] of Object.entries(update.$set ?? {})) {
      document[field] = this.#clone(value);
    }

    for (const [field, value] of Object.entries(update.$inc ?? {})) {
      document[field] += value;
    }

    for (const field of Object.keys(update.$unset ?? {})) {
      delete document[field];
    }
  }

  #matches(document, filter) {
    return Object.entries(filter).every(([field, condition]) => {
      if (field === '$and') {
        return condition.every((child) => this.#matches(document, child));
      }

      if (field === '$or') {
        return condition.some((child) => this.#matches(document, child));
      }

      if (field === '$expr') {
        return this.#matchesExpression(document, condition);
      }

      return this.#matchesField(document[field], condition);
    });
  }

  #matchesExpression(document, expression) {
    if (expression.$lt) {
      const [left, right] = expression.$lt;
      return this.#resolveExpression(document, left) < this.#resolveExpression(document, right);
    }

    if (expression.$gte) {
      const [left, right] = expression.$gte;
      return this.#resolveExpression(document, left) >= this.#resolveExpression(document, right);
    }

    throw new Error(`Unsupported expression ${JSON.stringify(expression)}.`);
  }

  #resolveExpression(document, value) {
    if (typeof value === 'string' && value.startsWith('$')) {
      return document[value.slice(1)];
    }

    return value;
  }

  #matchesField(value, condition) {
    if (!condition || typeof condition !== 'object' || condition instanceof Date) {
      return this.#compareValues(value, condition) === 0;
    }

    return Object.entries(condition).every(([operator, expected]) => {
      if (operator === '$in') {
        return expected.includes(value);
      }

      if (operator === '$lt') {
        return this.#compareValues(value, expected) < 0;
      }

      if (operator === '$lte') {
        return this.#compareValues(value, expected) <= 0;
      }

      if (operator === '$gte') {
        return this.#compareValues(value, expected) >= 0;
      }

      if (operator === '$type') {
        return expected === 'string' && typeof value === 'string';
      }

      throw new Error(`Unsupported operator ${operator}.`);
    });
  }

  #compare(left, right, sort) {
    for (const [field, direction] of Object.entries(sort)) {
      const comparison = this.#compareValues(left[field], right[field]);

      if (comparison !== 0) {
        return comparison * direction;
      }
    }

    return 0;
  }

  #compareValues(left, right) {
    const normalizedLeft = left instanceof Date ? left.getTime() : left;
    const normalizedRight = right instanceof Date ? right.getTime() : right;

    if (normalizedLeft === normalizedRight) {
      return 0;
    }

    return normalizedLeft > normalizedRight ? 1 : -1;
  }

  #clone(value) {
    return structuredClone(value);
  }
}

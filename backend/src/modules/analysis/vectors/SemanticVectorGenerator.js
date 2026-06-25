import { DeterministicHasher } from './DeterministicHasher.js';
import { VectorNormalizer } from './VectorNormalizer.js';

export class SemanticVectorGenerator {
  constructor({ length }, hasher = new DeterministicHasher(), normalizer = new VectorNormalizer()) {
    this.length = length;
    this.hasher = hasher;
    this.normalizer = normalizer;
  }

  generate(entry) {
    const vector = Array.from({ length: this.length }, () => 0);
    const tokens = this.#tokenize(
      [entry.description, entry.name, entry.transactionType, entry.currency]
        .filter((value) => typeof value === 'string')
        .join(' '),
    );

    for (const token of tokens) {
      const hash = this.hasher.hash(token);
      const index = hash % this.length;
      const direction = hash & 1 ? 1 : -1;
      vector[index] += direction;
    }

    return this.normalizer.l2(vector);
  }

  #tokenize(value) {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .split(/\s+/u)
      .filter(Boolean);
  }
}

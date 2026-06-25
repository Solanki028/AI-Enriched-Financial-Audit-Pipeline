import { DeterministicHasher } from './DeterministicHasher.js';
import { VectorNormalizer } from './VectorNormalizer.js';

export class EntityVectorGenerator {
  constructor({ length }, hasher = new DeterministicHasher(), normalizer = new VectorNormalizer()) {
    this.length = length;
    this.hasher = hasher;
    this.normalizer = normalizer;
  }

  generate(entry) {
    const entityValues = [
      entry.companyId,
      entry.userId,
      entry.postingBy,
      entry.glNumber,
      entry.name,
      entry.sourceId,
      entry.uploadId,
    ].map((value) => String(value ?? ''));
    const vector = Array.from({ length: this.length }, (_, index) => {
      const entityValue = entityValues[index % entityValues.length];
      const seed = this.hasher.hash(`entity-dimension:${index}`);
      return this.hasher.toUnitInterval(entityValue, seed) * 2 - 1;
    });

    return this.normalizer.l2(vector);
  }
}

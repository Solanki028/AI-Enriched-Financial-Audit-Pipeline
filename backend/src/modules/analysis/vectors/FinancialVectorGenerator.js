import { DeterministicHasher } from './DeterministicHasher.js';
import { VectorNormalizer } from './VectorNormalizer.js';

export class FinancialVectorGenerator {
  static HOURS_PER_DAY = 24;

  constructor(
    { amountScale, glNumberScale, length },
    hasher = new DeterministicHasher(),
    normalizer = new VectorNormalizer(),
  ) {
    this.amountScale = amountScale;
    this.glNumberScale = glNumberScale;
    this.length = length;
    this.hasher = hasher;
    this.normalizer = normalizer;
  }

  generate(entry) {
    const postingDate = new Date(entry.postingDate);
    const glNumber = this.#numericGlNumber(entry.glNumber);
    const balanceDifference = entry.debit - entry.credit;
    const denominator = Math.max(Math.abs(entry.debit) + Math.abs(entry.credit), this.amountScale);
    const features = [
      this.#scaleAmount(entry.amount),
      this.#scaleAmount(entry.debit),
      this.#scaleAmount(entry.credit),
      this.#scaleAmount(balanceDifference),
      this.normalizer.clamp(balanceDifference / denominator, -1, 1),
      postingDate.getUTCHours() / (FinancialVectorGenerator.HOURS_PER_DAY - 1),
      postingDate.getUTCDay() / 6,
      this.normalizer.clamp(glNumber / this.glNumberScale, 0, 1),
    ];
    const vector = Array.from({ length: this.length }, (_, index) => {
      const feature = features[index % features.length];
      const direction = this.hasher.hash(`financial:${index}`) & 1 ? 1 : -1;
      return feature * direction;
    });

    return this.normalizer.l2(vector);
  }

  #scaleAmount(value) {
    return this.normalizer.clamp(value / this.amountScale, -1, 1);
  }

  #numericGlNumber(value) {
    const numericValue = Number.parseInt(String(value), 10);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }
}

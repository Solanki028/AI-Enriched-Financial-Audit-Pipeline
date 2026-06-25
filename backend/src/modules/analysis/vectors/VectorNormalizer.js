export class VectorNormalizer {
  l2(values) {
    const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0));

    if (magnitude === 0) {
      return Object.freeze(values.map(() => 0));
    }

    return Object.freeze(values.map((value) => value / magnitude));
  }

  clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }
}

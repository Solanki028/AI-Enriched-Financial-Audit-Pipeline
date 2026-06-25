export class DeterministicHasher {
  static OFFSET_BASIS = 2166136261;

  static PRIME = 16777619;

  hash(value, seed = DeterministicHasher.OFFSET_BASIS) {
    const input = String(value);
    let hashValue = seed >>> 0;

    for (let index = 0; index < input.length; index += 1) {
      hashValue ^= input.charCodeAt(index);
      hashValue = Math.imul(hashValue, DeterministicHasher.PRIME);
    }

    return hashValue >>> 0;
  }

  toUnitInterval(value, seed) {
    return this.hash(value, seed) / 0xffffffff;
  }
}

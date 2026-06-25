export class VersionComparator {
  compare(leftVersion, rightVersion) {
    const leftParts = this.#parse(leftVersion);
    const rightParts = this.#parse(rightVersion);
    const maximumLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maximumLength; index += 1) {
      const leftPart = leftParts[index] ?? 0;
      const rightPart = rightParts[index] ?? 0;

      if (leftPart > rightPart) {
        return 1;
      }

      if (leftPart < rightPart) {
        return -1;
      }
    }

    return 0;
  }

  isOlder(candidateVersion, referenceVersion) {
    return this.compare(candidateVersion, referenceVersion) < 0;
  }

  isEqual(leftVersion, rightVersion) {
    return this.compare(leftVersion, rightVersion) === 0;
  }

  #parse(version) {
    if (typeof version !== 'string' || version.trim().length === 0) {
      throw new TypeError('Version must be a non-empty string.');
    }

    const normalizedVersion = version.trim().replace(/^v/iu, '');

    if (!/^\d+(?:\.\d+)*$/u.test(normalizedVersion)) {
      throw new TypeError(`Version ${version} must contain dot-separated numeric components.`);
    }

    return normalizedVersion.split('.').map((part) => Number.parseInt(part, 10));
  }
}

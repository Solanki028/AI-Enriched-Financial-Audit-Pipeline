import { VersionComparator } from './VersionComparator.js';

export class ContextVersionManager {
  constructor(currentVersion, comparator = new VersionComparator()) {
    comparator.compare(currentVersion, currentVersion);
    this.currentVersion = currentVersion;
    this.comparator = comparator;
    Object.freeze(this);
  }

  getVersion() {
    return this.currentVersion;
  }

  compare(candidateVersion) {
    return this.comparator.compare(candidateVersion, this.currentVersion);
  }

  isStale(candidateVersion) {
    return this.compare(candidateVersion) < 0;
  }

  isCurrent(candidateVersion) {
    return this.compare(candidateVersion) === 0;
  }
}

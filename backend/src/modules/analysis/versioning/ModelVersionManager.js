import { VersionComparator } from './VersionComparator.js';

export class ModelVersionManager {
  constructor(currentVersions, comparator = new VersionComparator()) {
    if (
      !currentVersions ||
      typeof currentVersions !== 'object' ||
      Array.isArray(currentVersions) ||
      Object.keys(currentVersions).length === 0
    ) {
      throw new TypeError('ModelVersionManager requires a model version map.');
    }

    for (const version of Object.values(currentVersions)) {
      comparator.compare(version, version);
    }

    this.currentVersions = Object.freeze({ ...currentVersions });
    this.comparator = comparator;
  }

  getVersions() {
    return this.currentVersions;
  }

  compare(component, candidateVersion) {
    return this.comparator.compare(candidateVersion, this.#getCurrentVersion(component));
  }

  isStale(component, candidateVersion) {
    return this.compare(component, candidateVersion) < 0;
  }

  getStaleComponents(candidateVersions) {
    return Object.freeze(
      Object.keys(this.currentVersions).filter((component) => {
        const candidateVersion = candidateVersions?.[component];
        return !candidateVersion || this.isStale(component, candidateVersion);
      }),
    );
  }

  #getCurrentVersion(component) {
    const currentVersion = this.currentVersions[component];

    if (!currentVersion) {
      throw new RangeError(`Unknown model component ${component}.`);
    }

    return currentVersion;
  }
}

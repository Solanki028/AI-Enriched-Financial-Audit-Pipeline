import { setTimeout as delay } from 'node:timers/promises';

import { PermanentJobError } from '../../modules/jobs/errors/PermanentJobError.js';
import { JobProcessor } from './JobProcessor.js';

export class RevisionProtectedProcessor extends JobProcessor {
  constructor({ analysisRepository, entryRepository, jobType, modelDelayMs }) {
    super(jobType);
    this.analysisRepository = analysisRepository;
    this.entryRepository = entryRepository;
    this.modelDelayMs = modelDelayMs;
  }

  async loadCurrentEntry(job) {
    const entry = await this.entryRepository.findById(job.entryId);

    if (!entry) {
      throw new PermanentJobError(`Journal entry ${job.entryId} was not found.`);
    }

    return Object.freeze({
      entry,
      stale: entry.sourceRevision !== job.sourceRevision,
    });
  }

  async simulateModelExecution() {
    if (this.modelDelayMs > 0) {
      await delay(this.modelDelayMs);
    }
  }
}

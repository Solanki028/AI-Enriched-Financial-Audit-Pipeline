import { JobType } from '../../jobs/policies/JobType.js';
import { BusinessValidationError } from '../../../shared/errors/BusinessValidationError.js';
import { DependencyUnavailableError } from '../../../shared/errors/DependencyUnavailableError.js';
import { NotFoundError } from '../../../shared/errors/NotFoundError.js';

export class AdministrationService {
  constructor({ entryRepository, healthMonitor, jobService }) {
    this.entryRepository = entryRepository;
    this.healthMonitor = healthMonitor;
    this.jobService = jobService;
  }

  async triggerModelMigration(command, context) {
    this.#assertDependencies(['entryRepository', 'jobService']);
    const entries = await this.#resolveEntries(command);
    const jobs = [];

    for (const entry of entries) {
      jobs.push(
        await this.jobService.enqueueModelMigration({
          correlationId: context.requestId,
          entryId: entry.entryId,
          sourceRevision: entry.sourceRevision,
          targetVersions: command.targetVersions,
        }),
      );
    }

    return Object.freeze({ enqueued: jobs.length, jobs });
  }

  async triggerPartialRiskRecalculation(command, context) {
    this.#assertDependencies(['entryRepository', 'jobService']);
    const entries = await this.#resolveEntries(command);
    const jobs = [];

    for (const entry of entries) {
      jobs.push(
        await this.jobService.enqueueAnalysisJob({
          correlationId: context.requestId,
          entryId: entry.entryId,
          jobType: JobType.PARTIAL_RISK,
          payload: { reason: 'admin_partial_recalculation' },
          priority: -5,
          sourceRevision: entry.sourceRevision,
        }),
      );
    }

    return Object.freeze({ enqueued: jobs.length, jobs });
  }

  async getQueueStatus() {
    this.#assertDependencies(['jobService']);
    return this.jobService.getQueueStatus();
  }

  async getWorkerStatus() {
    const queue = await this.getQueueStatus();
    return Object.freeze({ queue, status: 'observable' });
  }

  async getHealth() {
    return this.healthMonitor?.getStatus?.() ?? Object.freeze({ status: 'available' });
  }

  async #resolveEntries(command) {
    if (Array.isArray(command.entryIds) && command.entryIds.length > 0) {
      const entries = await this.entryRepository.findManyByIds(command.entryIds);
      if (entries.length !== command.entryIds.length) {
        throw new NotFoundError('One or more entries were not found.', {
          entryIds: command.entryIds,
        });
      }
      return entries;
    }

    if (command.scope === 'all') {
      return this.entryRepository.findMigrationCandidates(command.filters ?? {});
    }

    throw new BusinessValidationError(
      'entryIds or scope=all is required for administrative processing.',
    );
  }

  #assertDependencies(names) {
    const missing = names.filter((name) => !this[name]);
    if (missing.length > 0) {
      throw new DependencyUnavailableError('Administration dependency is not configured.', {
        missing,
      });
    }
  }
}

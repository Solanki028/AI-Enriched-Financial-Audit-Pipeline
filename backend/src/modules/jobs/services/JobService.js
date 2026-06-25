import { DependencyUnavailableError } from '../../../shared/errors/DependencyUnavailableError.js';
import { JobType } from '../policies/JobType.js';

export class JobService {
  constructor({ jobQueue, jobRepository = null, processingMetrics = null }) {
    this.jobQueue = jobQueue;
    this.jobRepository = jobRepository;
    this.processingMetrics = processingMetrics;
  }

  async enqueueAnalysisJob(command) {
    if (!this.jobQueue) {
      throw new DependencyUnavailableError('Job queue is not configured.');
    }

    const result = await this.jobQueue.enqueue(command);
    return Object.freeze({
      created: result.created,
      jobId: result.job.jobId,
      status: result.job.status,
    });
  }

  async enqueueModelMigration({ correlationId, entryId, sourceRevision, targetVersions }) {
    return this.enqueueAnalysisJob({
      correlationId,
      entryId,
      jobType: JobType.MODEL_MIGRATION,
      payload: { targetVersions },
      priority: -10,
      sourceRevision,
    });
  }

  async getEntryProcessingStatus(entryId) {
    if (!this.jobRepository) {
      return Object.freeze({ entryId, latestJob: null, status: 'unknown' });
    }

    const latestJob = await this.jobRepository.findLatestByEntryId(entryId);
    return Object.freeze({
      entryId,
      latestJob,
      status: latestJob?.status ?? 'idle',
    });
  }

  async getQueueStatus() {
    if (!this.jobQueue) {
      throw new DependencyUnavailableError('Job queue is not configured.');
    }

    const depth = await this.jobQueue.getDepth();
    const metrics = this.processingMetrics
      ? await this.processingMetrics.snapshot(this.jobQueue)
      : null;

    return Object.freeze({
      activeJobs: depth,
      metrics,
      status: 'available',
    });
  }
}

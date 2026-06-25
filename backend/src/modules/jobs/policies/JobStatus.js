export class JobStatus {
  static PENDING = 'pending';

  static QUEUED = 'queued';

  static PROCESSING = 'processing';

  static COMPLETED = 'completed';

  static FAILED = 'failed';

  static CANCELLED = 'cancelled';

  static STALE = 'stale';

  static ACTIVE = Object.freeze([JobStatus.PENDING, JobStatus.QUEUED, JobStatus.PROCESSING]);

  static TERMINAL = Object.freeze([
    JobStatus.COMPLETED,
    JobStatus.FAILED,
    JobStatus.CANCELLED,
    JobStatus.STALE,
  ]);

  static ALL = Object.freeze([...JobStatus.ACTIVE, ...JobStatus.TERMINAL]);
}

export class JobLeaseManager {
  constructor({ queue, renewalIntervalMs, workerId }) {
    this.queue = queue;
    this.renewalIntervalMs = renewalIntervalMs;
    this.workerId = workerId;
  }

  start(job, onLeaseLost) {
    let renewalInProgress = false;
    const timer = setInterval(async () => {
      if (renewalInProgress) {
        return;
      }

      renewalInProgress = true;

      try {
        const renewed = await this.queue.renewLease(job.jobId, this.workerId);

        if (!renewed) {
          clearInterval(timer);
          onLeaseLost();
        }
      } catch {
        clearInterval(timer);
        onLeaseLost();
      } finally {
        renewalInProgress = false;
      }
    }, this.renewalIntervalMs);

    timer.unref();
    return Object.freeze({
      stop: () => clearInterval(timer),
    });
  }
}

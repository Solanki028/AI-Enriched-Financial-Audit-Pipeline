export class JobClaimer {
  constructor(queue, workerId) {
    this.queue = queue;
    this.workerId = workerId;
    Object.freeze(this);
  }

  claimNextJob() {
    return this.queue.claimNextJob(this.workerId);
  }
}

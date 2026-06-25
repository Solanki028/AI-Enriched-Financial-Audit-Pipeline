export class JobProcessor {
  constructor(jobType) {
    if (new.target === JobProcessor) {
      throw new TypeError('JobProcessor is an abstract class.');
    }

    this.jobType = jobType;
  }

  async process(_job) {
    throw new TypeError(`${this.constructor.name} must implement process(job).`);
  }
}

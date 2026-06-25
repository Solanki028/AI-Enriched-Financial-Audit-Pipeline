export class JobProcessorRegistry {
  constructor(processors = []) {
    this.processors = new Map();

    for (const processor of processors) {
      this.register(processor);
    }
  }

  register(processor) {
    if (!processor?.jobType || typeof processor.process !== 'function') {
      throw new TypeError('Processor must expose jobType and process(job).');
    }

    if (this.processors.has(processor.jobType)) {
      throw new RangeError(`Processor already registered for ${processor.jobType}.`);
    }

    this.processors.set(processor.jobType, processor);
    return this;
  }

  get(jobType) {
    const processor = this.processors.get(jobType);

    if (!processor) {
      throw new RangeError(`No processor registered for ${jobType}.`);
    }

    return processor;
  }

  has(jobType) {
    return this.processors.has(jobType);
  }
}

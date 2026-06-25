export class ProcessingJob {
  constructor(properties) {
    Object.assign(this, properties);
    Object.freeze(this.payload);
    Object.freeze(this);
  }
}

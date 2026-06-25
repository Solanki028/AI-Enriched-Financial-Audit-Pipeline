export class JobErrorSerializer {
  serialize(error, occurredAt = new Date()) {
    return Object.freeze({
      code: typeof error?.code === 'string' ? error.code : 'JOB_PROCESSING_ERROR',
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Error',
      occurredAt,
      transient: error?.isTransient !== false,
    });
  }
}

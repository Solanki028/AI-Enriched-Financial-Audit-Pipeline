export class MongoIndexManager {
  constructor({ analysisRepository, auditRepository, entryRepository, jobQueue }) {
    this.analysisRepository = analysisRepository;
    this.auditRepository = auditRepository;
    this.entryRepository = entryRepository;
    this.jobQueue = jobQueue;
  }

  async ensureIndexes() {
    await Promise.all([
      this.entryRepository.ensureIndexes(),
      this.analysisRepository.ensureIndexes(),
      this.auditRepository.ensureIndexes(),
      this.jobQueue.ensureIndexes(),
    ]);
  }
}

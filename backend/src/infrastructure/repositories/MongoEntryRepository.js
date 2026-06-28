import { randomUUID } from 'node:crypto';

export class MongoEntryRepository {
  static COLLECTION_NAME = 'journal_entries';

  constructor({ collection, now = () => new Date(), idGenerator = randomUUID }) {
    this.collection = collection;
    this.now = now;
    this.idGenerator = idGenerator;
  }

  async ensureIndexes() {
    await this.collection.createIndexes([
      { key: { entryId: 1 }, name: 'entry_id_unique', unique: true },
      { key: { companyId: 1, transactionDate: -1 }, name: 'company_transaction_date' },
      { key: { processingStatus: 1, updatedAt: -1 }, name: 'entry_processing_status' },
      { key: { sourceRevision: 1 }, name: 'entry_source_revision' },
    ]);
  }

  async create(entry) {
    const now = this.now();
    const document = {
      amount: entry.amount ?? entry.debit ?? entry.credit ?? 0,
      postingDate: entry.postingDate ?? now.toISOString(),
      ...structuredClone(entry),
      createdAt: now,
      entryId: entry.entryId ?? this.idGenerator(),
      updatedAt: now,
    };

    await this.collection.insertOne(document);
    return this.#toEntity(document);
  }

  async findById(entryId) {
    const document = await this.collection.findOne({ entryId });
    return document ? this.#toEntity(document) : null;
  }

  async findManyByIds(entryIds) {
    const documents = await this.collection.find({ entryId: { $in: entryIds } }).toArray();
    const byId = new Map(documents.map((document) => [document.entryId, this.#toEntity(document)]));
    return entryIds.map((entryId) => byId.get(entryId)).filter(Boolean);
  }

  async findMigrationCandidates(filters = {}) {
    const query = this.#buildFilter(filters);
    return (await this.collection.find(query).toArray()).map((document) =>
      this.#toEntity(document),
    );
  }

  async findDashboard({ filters = {}, page, pageSize, sortBy, sortDirection }) {
    const query = this.#buildFilter(filters);
    const skip = (page - 1) * pageSize;
    const sort = { [sortBy]: sortDirection === 'asc' ? 1 : -1 };
    const projection = {
      _id: 0,
      amount: 1,
      companyId: 1,
      currency: 1,
      description: 1,
      entryId: 1,
      processingStatus: 1,
      riskScore: 1,
      severity: 1,
      sourceRevision: 1,
      transactionDate: 1,
    };

    const [items, total] = await Promise.all([
      this.collection.find(query, { projection }).sort(sort).skip(skip).limit(pageSize).toArray(),
      this.collection.countDocuments(query),
    ]);

    return Object.freeze({ items, page, pageSize, total });
  }

  async updateMetadata(entryId, changes) {
    const result = await this.collection.findOneAndUpdate(
      { entryId },
      { $set: { ...structuredClone(changes), updatedAt: this.now() } },
      { returnDocument: 'after' },
    );

    return result ? this.#toEntity(result) : null;
  }

  async updateWithRevision(entryId, changes, { expectedRevision, processingStatus }) {
    const result = await this.collection.findOneAndUpdate(
      { entryId, sourceRevision: expectedRevision },
      {
        $inc: { sourceRevision: 1 },
        $set: { ...structuredClone(changes), processingStatus, updatedAt: this.now() },
      },
      { returnDocument: 'after' },
    );

    return result ? this.#toEntity(result) : null;
  }

  async updateAnalysisSummary(entryId, sourceRevision, summary) {
    const result = await this.collection.updateOne(
      { entryId, sourceRevision },
      {
        $set: {
          processingStatus: summary.processingStatus,
          riskScore: summary.riskScore,
          severity: summary.severity,
          updatedAt: this.now(),
        },
      },
    );

    return result.matchedCount === 1;
  }

  async markProcessingStatus(entryId, sourceRevision, processingStatus) {
    const result = await this.collection.updateOne(
      { entryId, sourceRevision },
      { $set: { processingStatus, updatedAt: this.now() } },
    );

    return result.matchedCount === 1;
  }

  #buildFilter(filters = {}) {
    const query = {};

    if (filters.companyId) {
      query.companyId = filters.companyId;
    }

    if (filters.processingStatus) {
      query.processingStatus = filters.processingStatus;
    }

    if (filters.severity) {
      query.severity = filters.severity;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.transactionDate = {};
      if (filters.dateFrom) {
        query.transactionDate.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.transactionDate.$lte = filters.dateTo;
      }
    }

    if (Number.isFinite(filters.riskMin) || Number.isFinite(filters.riskMax)) {
      query.riskScore = {};
      if (Number.isFinite(filters.riskMin)) {
        query.riskScore.$gte = filters.riskMin;
      }
      if (Number.isFinite(filters.riskMax)) {
        query.riskScore.$lte = filters.riskMax;
      }
    }

    return query;
  }

  #toEntity(document) {
    const entity = { ...document };
    delete entity._id;
    return Object.freeze(entity);
  }
}

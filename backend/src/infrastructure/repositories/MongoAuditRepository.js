import { randomUUID } from 'node:crypto';

export class MongoAuditRepository {
  static COLLECTION_NAME = 'audit_events';

  constructor({ collection, idGenerator = randomUUID }) {
    this.collection = collection;
    this.idGenerator = idGenerator;
  }

  async ensureIndexes() {
    await this.collection.createIndexes([
      { key: { auditEventId: 1 }, name: 'audit_event_id_unique', unique: true },
      { key: { entryId: 1, occurredAt: -1 }, name: 'audit_entry_history' },
      { key: { correlationId: 1 }, name: 'audit_correlation' },
    ]);
  }

  async create(event) {
    const document = {
      ...structuredClone(event),
      auditEventId: event.auditEventId ?? this.idGenerator(),
    };
    await this.collection.insertOne(document);
    return Object.freeze(document);
  }

  async find(query = {}) {
    const filter = {};
    if (query.entryId) {
      filter.entryId = query.entryId;
    }
    if (query.correlationId) {
      filter.correlationId = query.correlationId;
    }

    return this.collection.find(filter, { projection: { _id: 0 } }).sort({ occurredAt: -1 }).limit(100).toArray();
  }
}

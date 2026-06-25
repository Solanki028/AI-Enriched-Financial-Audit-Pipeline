export class MongoJobRepository {
  constructor({ collection }) {
    this.collection = collection;
  }

  async findLatestByEntryId(entryId) {
    const document = await this.collection.findOne(
      { entryId },
      { projection: { _id: 0 }, sort: { createdAt: -1 } },
    );
    return document ? Object.freeze(document) : null;
  }
}

export class LazyMongoCollection {
  constructor({ collectionName, mongoConnection }) {
    this.collectionName = collectionName;
    this.mongoConnection = mongoConnection;
  }

  countDocuments(filter, options) {
    return this.#collection().countDocuments(filter, options);
  }

  createIndex(indexSpec, options) {
    return this.#collection().createIndex(indexSpec, options);
  }

  createIndexes(indexSpecs, options) {
    return this.#collection().createIndexes(indexSpecs, options);
  }

  find(filter = {}, options = {}) {
    return this.#collection().find(filter, options);
  }

  findOne(filter, options) {
    return this.#collection().findOne(filter, options);
  }

  findOneAndUpdate(filter, update, options) {
    return this.#collection().findOneAndUpdate(filter, update, options);
  }

  insertOne(document, options) {
    return this.#collection().insertOne(document, options);
  }

  updateMany(filter, update, options) {
    return this.#collection().updateMany(filter, update, options);
  }

  updateOne(filter, update, options) {
    return this.#collection().updateOne(filter, update, options);
  }

  #collection() {
    return this.mongoConnection.db.collection(this.collectionName);
  }
}

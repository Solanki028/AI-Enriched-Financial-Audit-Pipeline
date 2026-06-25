export class MongoAnalysisRepository {
  static COLLECTION_NAME = 'entry_analyses';

  constructor({ collection, entryRepository = null, now = () => new Date() }) {
    this.collection = collection;
    this.entryRepository = entryRepository;
    this.now = now;
  }

  async ensureIndexes() {
    await this.collection.createIndexes([
      { key: { analysisId: 1 }, name: 'analysis_id_unique', unique: true, sparse: true },
      { key: { entryId: 1, sourceRevision: -1, createdAt: -1 }, name: 'latest_analysis_by_entry' },
      { key: { entryId: 1, stale: 1 }, name: 'analysis_staleness' },
      { key: { severity: 1, riskScore: -1 }, name: 'analysis_risk_dashboard' },
    ]);
  }

  async findLatestByEntryId(entryId) {
    const document = await this.collection.findOne(
      { entryId },
      { sort: { sourceRevision: -1, createdAt: -1 } },
    );
    return document ? this.#toAnalysis(document) : null;
  }

  async markStale(entryId, newerSourceRevision) {
    const result = await this.collection.updateMany(
      { entryId, sourceRevision: { $lt: newerSourceRevision }, stale: { $ne: true } },
      { $set: { stale: true, staleAt: this.now(), updatedAt: this.now() } },
    );

    return result.modifiedCount;
  }

  async saveFullAnalysisIfRevisionMatches({ analysis, entryId, sourceRevision }) {
    return this.#saveAnalysisIfRevisionMatches({ analysis, entryId, sourceRevision, mode: 'full' });
  }

  async saveModelMigrationIfRevisionMatches({ analysis, entryId, sourceRevision, targetVersions }) {
    const enrichedAnalysis = { ...this.#plainAnalysis(analysis), modelVersions: targetVersions };
    return this.#saveAnalysisIfRevisionMatches({
      analysis: enrichedAnalysis,
      entryId,
      mode: 'migration',
      sourceRevision,
    });
  }

  async updateRiskAndComplianceIfRevisionMatches({ entryId, sourceRevision, update }) {
    if (!(await this.#entryRevisionMatches(entryId, sourceRevision))) {
      return false;
    }

    const now = this.now();
    const result = await this.collection.findOneAndUpdate(
      { entryId, sourceRevision },
      {
        $set: {
          compliance: structuredClone(update.compliance),
          contextVersion: update.contextVersion,
          riskScore: update.riskScore,
          severity: update.severity,
          stale: false,
          triggeredRules: structuredClone(update.triggeredRules),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          entryId,
          sourceRevision,
        },
      },
      { returnDocument: 'after', upsert: true },
    );

    await this.#syncEntrySummary(entryId, sourceRevision, {
      processingStatus: 'completed',
      riskScore: update.riskScore,
      severity: update.severity,
    });

    return Boolean(result);
  }

  async searchSimilar({ entryId, limit, strategy, vector }) {
    const vectorField = this.#vectorField(strategy);
    const documents = await this.collection
      .find({ entryId: { $ne: entryId }, [vectorField]: { $type: 'array' }, stale: { $ne: true } })
      .toArray();

    return documents
      .map((document) => ({
        entry: document.entrySummary ?? { companyId: document.companyId, description: document.description },
        entryId: document.entryId,
        similarityScore: this.#cosineSimilarity(vector, document[vectorField]),
      }))
      .sort((left, right) => right.similarityScore - left.similarityScore)
      .slice(0, limit);
  }

  async #saveAnalysisIfRevisionMatches({ analysis, entryId, mode, sourceRevision }) {
    if (!(await this.#entryRevisionMatches(entryId, sourceRevision))) {
      return false;
    }

    const document = {
      ...this.#plainAnalysis(analysis),
      analysisMode: mode,
      createdAt: this.now(),
      entryId,
      sourceRevision,
      stale: false,
      updatedAt: this.now(),
    };

    await this.collection.updateMany(
      { entryId, sourceRevision: { $lt: sourceRevision }, stale: { $ne: true } },
      { $set: { stale: true, staleAt: this.now(), updatedAt: this.now() } },
    );
    await this.collection.updateOne(
      { entryId, sourceRevision },
      { $set: document },
      { upsert: true },
    );
    await this.#syncEntrySummary(entryId, sourceRevision, {
      processingStatus: 'completed',
      riskScore: document.riskScore,
      severity: document.severity,
    });

    return true;
  }

  async #entryRevisionMatches(entryId, sourceRevision) {
    if (!this.entryRepository) {
      return true;
    }

    const entry = await this.entryRepository.findById(entryId);
    return entry?.sourceRevision === sourceRevision;
  }

  async #syncEntrySummary(entryId, sourceRevision, summary) {
    await this.entryRepository?.markProcessingStatus?.(entryId, sourceRevision, summary.processingStatus);
  }

  #plainAnalysis(analysis) {
    const plain = typeof analysis.toJSON === 'function' ? analysis.toJSON() : structuredClone(analysis);
    const vectors = plain.vectors ?? {};
    return {
      ...plain,
      entityVector: plain.entityVector ?? vectors.entity,
      financialVector: plain.financialVector ?? vectors.financial,
      semanticVector: plain.semanticVector ?? vectors.semantic,
    };
  }

  #toAnalysis(document) {
    const { _id, ...analysis } = document;
    return Object.freeze(analysis);
  }

  #vectorField(strategy) {
    if (strategy === 'semantic') {
      return 'semanticVector';
    }
    if (strategy === 'financial') {
      return 'financialVector';
    }
    return 'entityVector';
  }

  #cosineSimilarity(left, right) {
    const length = Math.min(left.length, right.length);
    let dot = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < length; index += 1) {
      dot += left[index] * right[index];
      leftMagnitude += left[index] * left[index];
      rightMagnitude += right[index] * right[index];
    }

    if (leftMagnitude === 0 || rightMagnitude === 0) {
      return 0;
    }

    return Number((dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))).toFixed(6));
  }
}

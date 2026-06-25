import { JobType } from '../../jobs/policies/JobType.js';
import { BusinessValidationError } from '../../../shared/errors/BusinessValidationError.js';
import { ConflictError } from '../../../shared/errors/ConflictError.js';
import { DependencyUnavailableError } from '../../../shared/errors/DependencyUnavailableError.js';
import { NotFoundError } from '../../../shared/errors/NotFoundError.js';
import { EntryChangeClassifier } from '../policies/EntryChangeClassifier.js';
import { EntryResponseSerializer } from '../serializers/EntryResponseSerializer.js';

export class EntryService {
  constructor({
    analysisRepository,
    auditService,
    entryRepository,
    jobService,
    serializer = new EntryResponseSerializer(),
  }) {
    this.analysisRepository = analysisRepository;
    this.auditService = auditService;
    this.entryRepository = entryRepository;
    this.jobService = jobService;
    this.changeClassifier = new EntryChangeClassifier();
    this.serializer = serializer;
  }

  async createEntry(command, context) {
    this.#assertDependencies(['entryRepository', 'auditService', 'jobService']);
    this.#validateCreate(command);

    const createdEntry = await this.entryRepository.create({
      ...command,
      processingStatus: 'queued',
      sourceRevision: 1,
    });

    await this.auditService.recordEvent({
      action: 'entry_created',
      actorId: context.actorId,
      correlationId: context.requestId,
      entryId: createdEntry.entryId,
      metadata: { sourceRevision: createdEntry.sourceRevision },
    });

    await this.jobService.enqueueAnalysisJob({
      correlationId: context.requestId,
      entryId: createdEntry.entryId,
      jobType: JobType.FULL_ANALYSIS,
      payload: { reason: 'entry_created' },
      sourceRevision: createdEntry.sourceRevision,
    });

    return Object.freeze({
      entryId: createdEntry.entryId,
      processingStatus: 'queued',
      sourceRevision: createdEntry.sourceRevision,
    });
  }

  async updateEntry(entryId, changes, context) {
    this.#assertDependencies([
      'analysisRepository',
      'entryRepository',
      'auditService',
      'jobService',
    ]);
    this.#validateUpdate(changes);

    const existing = await this.entryRepository.findById(entryId);
    if (!existing) {
      throw new NotFoundError('Journal entry was not found.', { entryId });
    }

    const changedFields = this.#changedFields(existing, changes);
    if (changedFields.length === 0) {
      return Object.freeze({
        changedFields,
        entryId,
        processingStatus: existing.processingStatus,
        sourceRevision: existing.sourceRevision,
        updateType: 'no_change',
      });
    }

    const classification = this.changeClassifier.classify(changedFields);

    if (classification.type === 'metadata_only') {
      const updated = await this.entryRepository.updateMetadata(entryId, changes);
      await this.auditService.recordEvent({
        action: 'entry_metadata_updated',
        actorId: context.actorId,
        correlationId: context.requestId,
        entryId,
        metadata: { changedFields },
      });

      return Object.freeze({
        changedFields,
        entryId,
        processingStatus: updated.processingStatus,
        sourceRevision: updated.sourceRevision,
        updateType: classification.type,
      });
    }

    const updated = await this.entryRepository.updateWithRevision(entryId, changes, {
      expectedRevision: existing.sourceRevision,
      processingStatus: 'queued',
    });

    if (!updated) {
      throw new ConflictError('Journal entry revision changed before update completed.', {
        entryId,
        expectedRevision: existing.sourceRevision,
      });
    }

    await this.analysisRepository.markStale(entryId, updated.sourceRevision);
    await this.auditService.recordEvent({
      action: 'entry_updated',
      actorId: context.actorId,
      correlationId: context.requestId,
      entryId,
      metadata: {
        changedFields,
        sourceRevision: updated.sourceRevision,
        updateType: classification.type,
      },
    });

    await this.jobService.enqueueAnalysisJob({
      correlationId: context.requestId,
      entryId,
      jobType:
        classification.type === 'full_analysis_required'
          ? JobType.FULL_ANALYSIS
          : JobType.PARTIAL_RISK,
      payload: { changedFields, reason: classification.type },
      sourceRevision: updated.sourceRevision,
    });

    return Object.freeze({
      changedFields,
      entryId,
      processingStatus: 'queued',
      sourceRevision: updated.sourceRevision,
      updateType: classification.type,
    });
  }

  async getEntry(entryId) {
    this.#assertDependencies(['analysisRepository', 'entryRepository', 'jobService']);
    const entry = await this.entryRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundError('Journal entry was not found.', { entryId });
    }

    const [analysis, processingStatus] = await Promise.all([
      this.analysisRepository.findLatestByEntryId(entryId),
      this.jobService.getEntryProcessingStatus(entryId),
    ]);

    return this.serializer.serializeEntryDetail({ analysis, entry, processingStatus });
  }

  async listEntries(query) {
    this.#assertDependencies(['entryRepository']);
    const result = await this.entryRepository.findDashboard(query);
    return Object.freeze({
      items: result.items.map((item) => this.serializer.serializeDashboardItem(item)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  }

  #assertDependencies(names) {
    const missing = names.filter((name) => !this[name]);
    if (missing.length > 0) {
      throw new DependencyUnavailableError('Application service dependency is not configured.', {
        missing,
      });
    }
  }

  #changedFields(existing, changes) {
    return Object.keys(changes).filter(
      (field) => JSON.stringify(existing[field]) !== JSON.stringify(changes[field]),
    );
  }

  #validateCreate(command) {
    const required = [
      'companyId',
      'accountId',
      'currency',
      'description',
      'debit',
      'credit',
      'transactionDate',
    ];
    const missing = required.filter(
      (field) => command[field] === undefined || command[field] === null || command[field] === '',
    );
    if (missing.length > 0) {
      throw new BusinessValidationError('Journal entry is missing required business fields.', {
        missing,
      });
    }
  }

  #validateUpdate(changes) {
    if (!changes || Object.keys(changes).length === 0) {
      throw new BusinessValidationError('At least one field must be provided for update.');
    }
  }
}

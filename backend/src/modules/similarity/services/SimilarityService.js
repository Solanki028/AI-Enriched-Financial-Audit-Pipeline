import { BusinessValidationError } from '../../../shared/errors/BusinessValidationError.js';
import { DependencyUnavailableError } from '../../../shared/errors/DependencyUnavailableError.js';
import { NotFoundError } from '../../../shared/errors/NotFoundError.js';

export class SimilarityService {
  static STRATEGIES = Object.freeze(['semantic', 'financial', 'entity']);

  constructor({ analysisRepository }) {
    this.analysisRepository = analysisRepository;
  }

  async searchSimilar({ entryId, strategy }) {
    if (!this.analysisRepository) {
      throw new DependencyUnavailableError('Analysis repository is not configured.');
    }

    if (!SimilarityService.STRATEGIES.includes(strategy)) {
      throw new BusinessValidationError('Unsupported similarity strategy.', { strategy });
    }

    const sourceAnalysis = await this.analysisRepository.findLatestByEntryId(entryId);
    if (!sourceAnalysis) {
      throw new NotFoundError('Source analysis was not found.', { entryId });
    }

    const vector = this.#selectVector(sourceAnalysis, strategy);
    if (!Array.isArray(vector)) {
      throw new BusinessValidationError('Source analysis does not contain the requested vector.', {
        entryId,
        strategy,
      });
    }

    const results = await this.analysisRepository.searchSimilar({
      entryId,
      limit: 5,
      strategy,
      vector,
    });

    return Object.freeze({
      entryId,
      results: results.map((result) => ({
        entry: result.entry,
        entryId: result.entryId,
        similarityScore: result.similarityScore,
      })),
      strategy,
    });
  }

  #selectVector(analysis, strategy) {
    if (strategy === 'semantic') {
      return analysis.semanticVector;
    }

    if (strategy === 'financial') {
      return analysis.financialVector;
    }

    return analysis.entityVector;
  }
}

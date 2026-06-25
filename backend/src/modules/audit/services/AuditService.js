import { DependencyUnavailableError } from '../../../shared/errors/DependencyUnavailableError.js';

export class AuditService {
  constructor({ auditRepository }) {
    this.auditRepository = auditRepository;
  }

  async recordEvent(event) {
    if (!this.auditRepository) {
      throw new DependencyUnavailableError('Audit repository is not configured.');
    }

    return this.auditRepository.create({
      ...event,
      occurredAt: new Date(),
    });
  }

  async listEvents(query) {
    if (!this.auditRepository) {
      throw new DependencyUnavailableError('Audit repository is not configured.');
    }

    return this.auditRepository.find(query);
  }
}

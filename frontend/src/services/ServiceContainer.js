import { ApiClientFactory } from '../api/apiClientFactory.js';
import { AdminService } from './AdminService.js';
import { AuditService } from './AuditService.js';
import { EntryService } from './EntryService.js';
import { SimilarityService } from './SimilarityService.js';

export class ServiceContainer {
  constructor() {
    this.apiClient = ApiClientFactory.create();
    this.entryService = new EntryService(this.apiClient);
    this.similarityService = new SimilarityService(this.apiClient);
    this.adminService = new AdminService(this.apiClient);
    this.auditService = new AuditService(this.apiClient);
  }
}

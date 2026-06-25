export class AdminService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  getQueueStatus() {
    return this.apiClient.get('/api/admin/queue/status');
  }

  getWorkerStatus() {
    return this.apiClient.get('/api/admin/workers/status');
  }

  triggerModelMigration(payload) {
    return this.apiClient.post('/api/admin/model-migrations', payload);
  }

  triggerRiskRecalculation(payload) {
    return this.apiClient.post('/api/admin/risk-recalculations', payload);
  }
}

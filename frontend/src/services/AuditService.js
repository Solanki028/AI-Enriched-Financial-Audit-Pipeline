export class AuditService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  listEvents(query) {
    return this.apiClient.get('/api/audit/events', { query });
  }
}

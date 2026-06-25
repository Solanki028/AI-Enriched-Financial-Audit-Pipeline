export class EntryService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  createEntry(payload) {
    return this.apiClient.post('/api/entries', payload);
  }

  updateEntry(entryId, payload) {
    return this.apiClient.put(
      '/api/entries/' + encodeURIComponent(entryId),
      payload,
    );
  }

  getEntry(entryId) {
    return this.apiClient.get('/api/entries/' + encodeURIComponent(entryId));
  }

  listEntries(query) {
    return this.apiClient.get('/api/entries', { query });
  }
}

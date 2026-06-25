export class SimilarityService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  searchSimilar(payload) {
    return this.apiClient.post('/api/entries/search/similar', payload);
  }
}

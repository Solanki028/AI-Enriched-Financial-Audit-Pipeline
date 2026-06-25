export class SimilarityController {
  constructor({ similarityService, validator }) {
    this.similarityService = similarityService;
    this.validator = validator;
    this.search = this.search.bind(this);
  }

  async search(request, response) {
    const query = this.validator.validateSearch(request);
    const result = await this.similarityService.searchSimilar(query);
    response.status(200).json({ data: result });
  }
}

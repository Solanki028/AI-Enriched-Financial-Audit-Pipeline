export class EntryController {
  constructor({ entryService, validator }) {
    this.entryService = entryService;
    this.validator = validator;
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.get = this.get.bind(this);
    this.list = this.list.bind(this);
  }

  async create(request, response) {
    const command = this.validator.validateCreate(request);
    const result = await this.entryService.createEntry(command, this.#context(request));
    response.status(202).json({ data: result });
  }

  async update(request, response) {
    const { changes, entryId } = this.validator.validateUpdate(request);
    const result = await this.entryService.updateEntry(entryId, changes, this.#context(request));
    response.status(200).json({ data: result });
  }

  async get(request, response) {
    const entryId = this.validator.validateGet(request);
    const result = await this.entryService.getEntry(entryId);
    response.status(200).json({ data: result });
  }

  async list(request, response) {
    const query = this.validator.validateList(request);
    const result = await this.entryService.listEntries(query);
    response.status(200).json({ data: result });
  }

  #context(request) {
    return {
      actorId: request.headers['x-actor-id'] ?? 'system',
      requestId: request.requestId,
    };
  }
}

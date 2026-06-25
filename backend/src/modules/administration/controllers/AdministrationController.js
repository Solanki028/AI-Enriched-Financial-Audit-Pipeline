export class AdministrationController {
  constructor({ administrationService, validator }) {
    this.administrationService = administrationService;
    this.validator = validator;
    this.migrateModel = this.migrateModel.bind(this);
    this.recalculateRisk = this.recalculateRisk.bind(this);
    this.queueStatus = this.queueStatus.bind(this);
    this.workerStatus = this.workerStatus.bind(this);
    this.health = this.health.bind(this);
  }

  async migrateModel(request, response) {
    const command = this.validator.validateModelMigration(request);
    const result = await this.administrationService.triggerModelMigration(
      command,
      this.#context(request),
    );
    response.status(202).json({ data: result });
  }

  async recalculateRisk(request, response) {
    const command = this.validator.validatePartialRisk(request);
    const result = await this.administrationService.triggerPartialRiskRecalculation(
      command,
      this.#context(request),
    );
    response.status(202).json({ data: result });
  }

  async queueStatus(_request, response) {
    const result = await this.administrationService.getQueueStatus();
    response.status(200).json({ data: result });
  }

  async workerStatus(_request, response) {
    const result = await this.administrationService.getWorkerStatus();
    response.status(200).json({ data: result });
  }

  async health(_request, response) {
    const result = await this.administrationService.getHealth();
    response.status(200).json({ data: result });
  }

  #context(request) {
    return {
      actorId: request.headers['x-actor-id'] ?? 'system',
      requestId: request.requestId,
    };
  }
}

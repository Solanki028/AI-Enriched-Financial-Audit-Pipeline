export class AuditController {
  constructor({ auditService }) {
    this.auditService = auditService;
    this.list = this.list.bind(this);
  }

  async list(request, response) {
    const result = await this.auditService.listEvents(request.query);
    response.status(200).json({ data: result });
  }
}

import { Router } from 'express';

import { AsyncController } from '../../../app/routes/AsyncController.js';

export class AuditRoutes {
  constructor({ controller }) {
    this.controller = controller;
  }

  createRouter() {
    const router = Router();
    router.get('/audit/events', AsyncController.wrap(this.controller.list));
    return router;
  }
}

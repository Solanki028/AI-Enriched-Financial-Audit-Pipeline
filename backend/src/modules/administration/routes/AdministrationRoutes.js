import { Router } from 'express';

import { AsyncController } from '../../../app/routes/AsyncController.js';

export class AdministrationRoutes {
  constructor({ controller }) {
    this.controller = controller;
  }

  createRouter() {
    const router = Router();
    router.post('/admin/model-migrations', AsyncController.wrap(this.controller.migrateModel));
    router.post(
      '/admin/risk-recalculations',
      AsyncController.wrap(this.controller.recalculateRisk),
    );
    router.get('/admin/queue/status', AsyncController.wrap(this.controller.queueStatus));
    router.get('/admin/workers/status', AsyncController.wrap(this.controller.workerStatus));
    router.get('/admin/health', AsyncController.wrap(this.controller.health));
    return router;
  }
}

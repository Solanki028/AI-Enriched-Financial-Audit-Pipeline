import { Router } from 'express';

import { AsyncController } from '../../../app/routes/AsyncController.js';

export class EntryRoutes {
  constructor({ controller }) {
    this.controller = controller;
  }

  createRouter() {
    const router = Router();
    router.post('/', AsyncController.wrap(this.controller.create));
    router.get('/', AsyncController.wrap(this.controller.list));
    router.get('/:id', AsyncController.wrap(this.controller.get));
    router.put('/:id', AsyncController.wrap(this.controller.update));
    return router;
  }
}

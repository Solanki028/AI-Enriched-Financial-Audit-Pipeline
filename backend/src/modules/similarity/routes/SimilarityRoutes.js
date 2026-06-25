import { Router } from 'express';

import { AsyncController } from '../../../app/routes/AsyncController.js';

export class SimilarityRoutes {
  constructor({ controller }) {
    this.controller = controller;
  }

  createRouter() {
    const router = Router();
    router.post('/entries/search/similar', AsyncController.wrap(this.controller.search));
    return router;
  }
}

import { Router } from 'express';

import { AdministrationController } from '../../modules/administration/controllers/AdministrationController.js';
import { AdministrationRoutes } from '../../modules/administration/routes/AdministrationRoutes.js';
import { AdministrationRequestValidator } from '../../modules/administration/validators/AdministrationRequestValidator.js';
import { AuditController } from '../../modules/audit/controllers/AuditController.js';
import { AuditRoutes } from '../../modules/audit/routes/AuditRoutes.js';
import { EntryController } from '../../modules/entries/controllers/EntryController.js';
import { EntryRoutes } from '../../modules/entries/routes/EntryRoutes.js';
import { EntryRequestValidator } from '../../modules/entries/validators/EntryRequestValidator.js';
import { SimilarityController } from '../../modules/similarity/controllers/SimilarityController.js';
import { SimilarityRoutes } from '../../modules/similarity/routes/SimilarityRoutes.js';
import { SimilarityRequestValidator } from '../../modules/similarity/validators/SimilarityRequestValidator.js';

export class ApiRouterFactory {
  constructor({ administrationService, auditService, entryService, similarityService }) {
    this.administrationService = administrationService;
    this.auditService = auditService;
    this.entryService = entryService;
    this.similarityService = similarityService;
  }

  createRouter() {
    const router = Router();

    const entryController = new EntryController({
      entryService: this.entryService,
      validator: new EntryRequestValidator(),
    });
    router.use('/entries', new EntryRoutes({ controller: entryController }).createRouter());

    const similarityController = new SimilarityController({
      similarityService: this.similarityService,
      validator: new SimilarityRequestValidator(),
    });
    router.use(new SimilarityRoutes({ controller: similarityController }).createRouter());

    const administrationController = new AdministrationController({
      administrationService: this.administrationService,
      validator: new AdministrationRequestValidator(),
    });
    router.use(new AdministrationRoutes({ controller: administrationController }).createRouter());

    const auditController = new AuditController({ auditService: this.auditService });
    router.use(new AuditRoutes({ controller: auditController }).createRouter());

    return router;
  }
}

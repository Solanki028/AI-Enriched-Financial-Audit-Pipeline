import { pathToFileURL } from 'node:url';

import { ScriptBootstrap } from '../bootstrap/ScriptBootstrap.js';

export class ModelMigrationScript {
  constructor(container) {
    this.container = container;
    this.logger = container.logger.child({ process: 'model-migration' });
  }

  async execute() {
    const targetVersions = Object.freeze({
      anomaly: 'v1.1',
      compliance: 'v1.1',
      entityVector: 'v1.1',
      financialVector: 'v1.1',
      risk: 'v1.1',
      semanticVector: 'v1.1',
    });

    const result = await this.container.administrationService.triggerModelMigration(
      {
        scope: 'all',
        targetVersions,
      },
      {
        actorId: 'model-migration-script',
        requestId: 'model-migration-' + Date.now(),
      },
    );

    this.logger.info({ result, targetVersions }, 'Model migration jobs queued.');
    return result;
  }

  static async launch() {
    const bootstrap = new ScriptBootstrap();
    await bootstrap.run(new ModelMigrationScript(bootstrap.container));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ModelMigrationScript.launch();
}

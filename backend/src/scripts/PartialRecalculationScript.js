import { pathToFileURL } from 'node:url';

import { ScriptBootstrap } from '../bootstrap/ScriptBootstrap.js';

export class PartialRecalculationScript {
  constructor(container) {
    this.container = container;
    this.logger = container.logger.child({ process: 'partial-recalculation' });
  }

  async execute() {
    const result = await this.container.administrationService.triggerPartialRiskRecalculation(
      {
        scope: 'all',
      },
      {
        actorId: 'partial-recalculation-script',
        requestId: 'partial-recalculation-' + Date.now(),
      },
    );

    this.logger.info({ result }, 'Partial risk recalculation jobs queued.');
    return result;
  }

  static async launch() {
    const bootstrap = new ScriptBootstrap();
    await bootstrap.run(new PartialRecalculationScript(bootstrap.container));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await PartialRecalculationScript.launch();
}

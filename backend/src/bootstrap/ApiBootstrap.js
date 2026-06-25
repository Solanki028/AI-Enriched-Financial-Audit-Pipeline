import { pathToFileURL } from 'node:url';

import { Container } from '../app/Container.js';
import { ProcessLifecycle } from './ProcessLifecycle.js';

export class ApiBootstrap {
  constructor(container = new Container()) {
    this.container = container;
    this.logger = container.logger.child({ process: 'api' });
    this.lifecycle = new ProcessLifecycle({
      logger: this.logger,
      shutdown: this.shutdown.bind(this),
    });
  }

  async run() {
    this.lifecycle.register();
    await this.container.mongoConnection.connect();
    await this.container.server.start();
  }

  async shutdown() {
    await this.container.server.stop();
    await this.container.mongoConnection.close();
  }

  static async launch() {
    const bootstrap = new ApiBootstrap();

    try {
      await bootstrap.run();
    } catch (error) {
      bootstrap.logger.fatal({ err: error }, 'API bootstrap failed.');
      await bootstrap.lifecycle.shutdown('bootstrapFailure', 1);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await ApiBootstrap.launch();
}

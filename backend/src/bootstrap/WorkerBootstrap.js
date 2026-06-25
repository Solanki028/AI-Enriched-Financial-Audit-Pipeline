import { pathToFileURL } from 'node:url';

import { Container } from '../app/Container.js';
import { ProcessLifecycle } from './ProcessLifecycle.js';

export class WorkerBootstrap {
  constructor(container = new Container()) {
    this.container = container;
    this.logger = container.logger.child({ process: 'worker' });
    this.lifecycle = new ProcessLifecycle({
      logger: this.logger,
      shutdown: this.shutdown.bind(this),
    });
  }

  async run() {
    this.lifecycle.register();
    await this.container.mongoConnection.connect();
    this.logger.info({}, 'Worker process foundation initialized.');
  }

  async shutdown() {
    await this.container.mongoConnection.close();
  }

  static async launch() {
    const bootstrap = new WorkerBootstrap();

    try {
      await bootstrap.run();
    } catch (error) {
      bootstrap.logger.fatal({ err: error }, 'Worker bootstrap failed.');
      await bootstrap.lifecycle.shutdown('bootstrapFailure', 1);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await WorkerBootstrap.launch();
}

import { Container } from '../app/Container.js';

export class ScriptBootstrap {
  constructor(container = new Container()) {
    this.container = container;
    this.logger = container.logger.child({ process: 'script' });
  }

  async run(script, args = []) {
    if (!script || typeof script.execute !== 'function') {
      throw new TypeError('A script instance with an execute method is required.');
    }

    await this.container.mongoConnection.connect();
    await this.container.mongoIndexManager.ensureIndexes();

    try {
      this.logger.info({ script: script.constructor.name }, 'Administrative script started.');
      const result = await script.execute(args);
      this.logger.info({ script: script.constructor.name }, 'Administrative script completed.');
      return result;
    } catch (error) {
      this.logger.error(
        { err: error, script: script.constructor.name },
        'Administrative script failed.',
      );
      throw error;
    } finally {
      await this.container.mongoConnection.close();
      this.logger.flush();
    }
  }
}

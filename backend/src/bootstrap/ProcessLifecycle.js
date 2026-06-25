export class ProcessLifecycle {
  constructor({ logger, shutdown }) {
    this.logger = logger.child({ component: 'ProcessLifecycle' });
    this.shutdownAction = shutdown;
    this.shutdownPromise = null;
    this.handleSigint = this.handleSigint.bind(this);
    this.handleSigterm = this.handleSigterm.bind(this);
    this.handleUncaughtException = this.handleUncaughtException.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
  }

  register() {
    process.once('SIGINT', this.handleSigint);
    process.once('SIGTERM', this.handleSigterm);
    process.once('uncaughtException', this.handleUncaughtException);
    process.once('unhandledRejection', this.handleUnhandledRejection);
  }

  async handleSigint() {
    await this.shutdown('SIGINT', 0);
  }

  async handleSigterm() {
    await this.shutdown('SIGTERM', 0);
  }

  async handleUncaughtException(error) {
    this.logger.fatal({ err: error }, 'Uncaught exception triggered application shutdown.');
    await this.shutdown('uncaughtException', 1);
  }

  async handleUnhandledRejection(reason) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    this.logger.fatal({ err: error }, 'Unhandled rejection triggered application shutdown.');
    await this.shutdown('unhandledRejection', 1);
  }

  async shutdown(reason, exitCode) {
    if (!this.shutdownPromise) {
      this.shutdownPromise = this.#performShutdown(reason, exitCode);
    }

    return this.shutdownPromise;
  }

  async #performShutdown(reason, exitCode) {
    let resolvedExitCode = exitCode;
    this.logger.info({ reason }, 'Application shutdown started.');

    try {
      await this.shutdownAction();
    } catch (error) {
      resolvedExitCode = 1;
      this.logger.error({ err: error, reason }, 'Application shutdown failed.');
    } finally {
      process.exitCode = resolvedExitCode;
      this.logger.info({ exitCode: resolvedExitCode, reason }, 'Application shutdown completed.');
      this.logger.flush();
    }
  }
}

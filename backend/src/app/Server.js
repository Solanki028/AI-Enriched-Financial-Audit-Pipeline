export class Server {
  constructor({ application, host, logger, port, shutdownTimeoutMs }) {
    this.application = application;
    this.host = host;
    this.logger = logger.child({ component: 'Server' });
    this.port = port;
    this.shutdownTimeoutMs = shutdownTimeoutMs;
    this.httpServer = null;
    this.stopPromise = null;
  }

  async start() {
    if (this.httpServer) {
      return this.httpServer;
    }

    await new Promise((resolve, reject) => {
      const server = this.application.handler.listen(this.port, this.host);

      server.once('listening', () => {
        this.httpServer = server;
        this.logger.info({ host: this.host, port: this.port }, 'HTTP server started.');
        resolve();
      });

      server.once('error', reject);
    });

    return this.httpServer;
  }

  async stop() {
    if (!this.httpServer) {
      return;
    }

    if (this.stopPromise) {
      return this.stopPromise;
    }

    this.stopPromise = this.#stopServer();

    try {
      await this.stopPromise;
    } finally {
      this.stopPromise = null;
    }
  }

  async #stopServer() {
    const server = this.httpServer;
    this.logger.info({}, 'Stopping HTTP server.');
    server.closeIdleConnections?.();

    let timeoutId;
    const forcedShutdown = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        this.logger.warn(
          { shutdownTimeoutMs: this.shutdownTimeoutMs },
          'HTTP shutdown timeout reached; closing active connections.',
        );
        server.closeAllConnections?.();
        resolve();
      }, this.shutdownTimeoutMs);
      timeoutId.unref();
    });

    const gracefulShutdown = new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await Promise.race([gracefulShutdown, forcedShutdown]);
    clearTimeout(timeoutId);
    this.httpServer = null;
    this.logger.info({}, 'HTTP server stopped.');
  }
}

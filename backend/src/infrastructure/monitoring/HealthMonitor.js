export class HealthMonitor {
  constructor({ mongoConnection, version }) {
    this.mongoConnection = mongoConnection;
    this.version = version;
    this.startedAt = Date.now();
    this.handle = this.handle.bind(this);
  }

  handle(_request, response) {
    const databaseStatus = this.mongoConnection.status;
    const isDatabaseConnected = databaseStatus === 'connected';
    const statusCode = isDatabaseConnected ? 200 : 503;

    response.status(statusCode).json({
      server: {
        status: isDatabaseConnected ? 'ok' : 'degraded',
        uptime: Number(((Date.now() - this.startedAt) / 1000).toFixed(3)),
      },
      database: {
        status: databaseStatus,
      },
      application: {
        version: this.version,
      },
    });
  }
}

import { setTimeout as delay } from 'node:timers/promises';

import { MongoClient } from 'mongodb';

export class MongoConnection {
  constructor(databaseConfig, logger) {
    this.config = databaseConfig;
    this.logger = logger.child({ component: 'MongoConnection' });
    this.client = null;
    this.database = null;
    this.connectionStatus = 'disconnected';
    this.connectPromise = null;
  }

  get status() {
    return this.connectionStatus;
  }

  get db() {
    if (this.connectionStatus !== 'connected' || !this.database) {
      throw new Error('MongoDB connection is not available.');
    }

    return this.database;
  }

  async connect() {
    if (this.connectionStatus === 'connected') {
      return this.database;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = this.#connectWithRetry();

    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  async close() {
    if (!this.client || this.connectionStatus === 'disconnected') {
      return;
    }

    this.connectionStatus = 'disconnecting';
    this.logger.info({}, 'Closing MongoDB connection.');

    try {
      await this.client.close();
      this.logger.info({}, 'MongoDB connection closed.');
    } finally {
      this.client = null;
      this.database = null;
      this.connectionStatus = 'disconnected';
    }
  }

  async #connectWithRetry() {
    this.connectionStatus = 'connecting';

    for (let attempt = 1; attempt <= this.config.connectRetryAttempts; attempt += 1) {
      try {
        return await this.#openConnection(attempt);
      } catch (error) {
        await this.#disposeFailedClient();

        if (attempt === this.config.connectRetryAttempts) {
          this.connectionStatus = 'failed';
          this.logger.error(
            { attempt, err: error },
            'MongoDB connection failed after all retry attempts.',
          );
          throw error;
        }

        const retryDelayMs = this.config.connectRetryBaseDelayMs * 2 ** (attempt - 1);
        this.logger.warn(
          { attempt, err: error, retryDelayMs },
          'MongoDB connection attempt failed; retrying.',
        );
        await delay(retryDelayMs);
      }
    }

    throw new Error('MongoDB connection retry loop ended unexpectedly.');
  }

  async #openConnection(attempt) {
    this.logger.info({ attempt }, 'Opening MongoDB connection.');
    this.client = new MongoClient(this.config.uri, this.config.clientOptions);
    this.#registerLifecycleEvents(this.client);

    await this.client.connect();
    this.database = this.client.db(this.config.databaseName);
    await this.database.command({ ping: 1 });
    this.connectionStatus = 'connected';

    this.logger.info(
      {
        attempt,
        databaseName: this.config.databaseName,
        maxPoolSize: this.config.maxPoolSize,
        minPoolSize: this.config.minPoolSize,
      },
      'MongoDB connection established.',
    );

    return this.database;
  }

  #registerLifecycleEvents(client) {
    client.on('connectionPoolCleared', (event) => {
      this.logger.warn({ address: event.address }, 'MongoDB connection pool cleared.');
    });

    client.on('serverHeartbeatFailed', (event) => {
      this.logger.warn(
        { connectionId: event.connectionId, failure: event.failure },
        'MongoDB heartbeat failed; the driver will continue server discovery.',
      );
    });

    client.on('topologyClosed', () => {
      if (this.connectionStatus === 'connected') {
        this.connectionStatus = 'disconnected';
        this.logger.warn({}, 'MongoDB topology closed unexpectedly.');
      }
    });
  }

  async #disposeFailedClient() {
    if (this.client) {
      await this.client.close().catch((error) => {
        this.logger.warn({ err: error }, 'Failed to close an unsuccessful MongoDB client.');
      });
    }

    this.client = null;
    this.database = null;
  }
}

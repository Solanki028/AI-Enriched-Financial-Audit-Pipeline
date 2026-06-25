import assert from 'node:assert/strict';
import test from 'node:test';

import request from 'supertest';

import { Application } from '../../src/app/Application.js';
import { HealthMonitor } from '../../src/infrastructure/monitoring/HealthMonitor.js';

class LoggerStub {
  child() {
    return this;
  }

  error() {
    return undefined;
  }

  info() {
    return undefined;
  }
}

class MongoConnectionStub {
  constructor(status) {
    this.connectionStatus = status;
  }

  get status() {
    return this.connectionStatus;
  }
}

class HealthApplicationFactory {
  static create(databaseStatus) {
    const logger = new LoggerStub();
    const healthMonitor = new HealthMonitor({
      mongoConnection: new MongoConnectionStub(databaseStatus),
      version: '1.0.0',
    });

    return new Application({
      applicationConfig: {
        corsOrigins: ['http://localhost:3000'],
        environment: 'test',
        jsonLimit: '1mb',
      },
      healthMonitor,
      logger,
    });
  }
}

test('GET /health returns healthy status when MongoDB is connected', async () => {
  const application = HealthApplicationFactory.create('connected');
  const response = await request(application.handler).get('/health').expect(200);

  assert.equal(response.body.server.status, 'ok');
  assert.equal(response.body.database.status, 'connected');
  assert.equal(response.body.application.version, '1.0.0');
  assert.equal(typeof response.body.server.uptime, 'number');
  assert.equal(response.headers['x-request-id'].length > 0, true);
});

test('GET /health returns degraded status when MongoDB is disconnected', async () => {
  const application = HealthApplicationFactory.create('disconnected');
  const response = await request(application.handler).get('/health').expect(503);

  assert.equal(response.body.server.status, 'degraded');
  assert.equal(response.body.database.status, 'disconnected');
});

test('unknown paths use the centralized 404 handler', async () => {
  const application = HealthApplicationFactory.create('connected');
  const response = await request(application.handler).get('/missing').expect(404);

  assert.equal(response.body.error.code, 'RESOURCE_NOT_FOUND');
  assert.equal(typeof response.body.error.requestId, 'string');
});

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { CorsPolicy } from './middleware/CorsPolicy.js';
import { ErrorHandler } from './middleware/ErrorHandler.js';
import { NotFoundHandler } from './middleware/NotFoundHandler.js';
import { RequestIdMiddleware } from './middleware/RequestIdMiddleware.js';
import { RequestLoggingMiddleware } from './middleware/RequestLoggingMiddleware.js';

export class Application {
  constructor({ applicationConfig, healthMonitor, logger }) {
    this.config = applicationConfig;
    this.healthMonitor = healthMonitor;
    this.logger = logger;
    this.express = express();
    this.requestIdMiddleware = new RequestIdMiddleware();
    this.requestLoggingMiddleware = new RequestLoggingMiddleware(logger);
    this.corsPolicy = new CorsPolicy(applicationConfig.corsOrigins);
    this.notFoundHandler = new NotFoundHandler();
    this.errorHandler = new ErrorHandler(logger, applicationConfig.environment);
    this.#configure();
  }

  get handler() {
    return this.express;
  }

  #configure() {
    this.express.disable('x-powered-by');
    this.express.use(this.requestIdMiddleware.handle);
    this.express.use(this.requestLoggingMiddleware.handle);
    this.express.use(helmet());
    this.express.use(
      cors({
        credentials: true,
        origin: this.corsPolicy.validateOrigin,
      }),
    );
    this.express.use(compression());
    this.express.use(express.json({ limit: this.config.jsonLimit }));
    this.express.get('/health', this.healthMonitor.handle);
    this.express.use(this.notFoundHandler.handle);
    this.express.use(this.errorHandler.handle);
  }
}

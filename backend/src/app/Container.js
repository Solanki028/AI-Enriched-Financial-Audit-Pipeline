import { randomUUID } from 'node:crypto';

import packageMetadata from '../../package.json' with { type: 'json' };

import { DatabaseConfig } from '../config/DatabaseConfig.js';
import { EnvironmentConfig } from '../config/EnvironmentConfig.js';
import { LoggerConfig } from '../config/LoggerConfig.js';
import { ProcessingConfig } from '../config/ProcessingConfig.js';
import { QueueConfig } from '../config/QueueConfig.js';
import { LazyMongoCollection } from '../infrastructure/database/LazyMongoCollection.js';
import { MongoConnection } from '../infrastructure/database/MongoConnection.js';
import { MongoIndexManager } from '../infrastructure/database/indexes/MongoIndexManager.js';
import { ApplicationLogger } from '../infrastructure/logging/ApplicationLogger.js';
import { HealthMonitor } from '../infrastructure/monitoring/HealthMonitor.js';
import { ProcessingMetrics } from '../infrastructure/monitoring/ProcessingMetrics.js';
import { JobLeaseManager } from '../infrastructure/queue/JobLeaseManager.js';
import { MongoJobQueue } from '../infrastructure/queue/MongoJobQueue.js';
import { MongoAnalysisRepository } from '../infrastructure/repositories/MongoAnalysisRepository.js';
import { MongoAuditRepository } from '../infrastructure/repositories/MongoAuditRepository.js';
import { MongoEntryRepository } from '../infrastructure/repositories/MongoEntryRepository.js';
import { MongoJobRepository } from '../infrastructure/repositories/MongoJobRepository.js';
import { AdministrationService } from '../modules/administration/services/AdministrationService.js';
import { ComplianceEvaluator } from '../modules/analysis/compliance/ComplianceEvaluator.js';
import { FullAnalysisPipelineFactory } from '../modules/analysis/pipelines/FullAnalysisPipelineFactory.js';
import { RiskEngineFactory } from '../modules/analysis/risk/RiskEngineFactory.js';
import { ContextVersionManager } from '../modules/analysis/versioning/ContextVersionManager.js';
import { AuditService } from '../modules/audit/services/AuditService.js';
import { EntryService } from '../modules/entries/services/EntryService.js';
import { JobRetryPolicy } from '../modules/jobs/policies/JobRetryPolicy.js';
import { JobErrorSerializer } from '../modules/jobs/services/JobErrorSerializer.js';
import { JobService } from '../modules/jobs/services/JobService.js';
import { ProcessingJobFactory } from '../modules/jobs/services/ProcessingJobFactory.js';
import { SimilarityService } from '../modules/similarity/services/SimilarityService.js';
import { JobProcessorRegistry } from '../workers/JobProcessorRegistry.js';
import { FullAnalysisProcessor } from '../workers/processors/FullAnalysisProcessor.js';
import { ModelMigrationProcessor } from '../workers/processors/ModelMigrationProcessor.js';
import { PartialRiskProcessor } from '../workers/processors/PartialRiskProcessor.js';
import { WorkerApplication } from '../workers/WorkerApplication.js';
import { WorkerRunner } from '../workers/WorkerRunner.js';
import { Application } from './Application.js';
import { DefaultAnalysisConfiguration } from './factories/DefaultAnalysisConfiguration.js';
import { openApiSpec } from './openapi/openApiSpec.js';
import { ApiRouterFactory } from './routes/ApiRouterFactory.js';
import { Server } from './Server.js';

export class Container {
  constructor({ environmentSource, envFile } = {}) {
    this.environmentConfig = new EnvironmentConfig({
      source: environmentSource,
      envFile,
    });
    this.applicationConfig = this.#createApplicationConfig();
    this.databaseConfig = new DatabaseConfig(this.environmentConfig);
    this.queueConfig = new QueueConfig(this.environmentConfig);
    this.processingConfig = new ProcessingConfig(this.environmentConfig);
    this.loggerConfig = new LoggerConfig(this.environmentConfig);
    this.logger = new ApplicationLogger(this.loggerConfig, {
      environment: this.applicationConfig.environment,
      version: packageMetadata.version,
    });
    this.mongoConnection = new MongoConnection(this.databaseConfig, this.logger);
    this.healthMonitor = new HealthMonitor({
      mongoConnection: this.mongoConnection,
      version: packageMetadata.version,
    });
    this.analysisConfiguration = DefaultAnalysisConfiguration.create();
    this.processingMetrics = new ProcessingMetrics();

    this.#createRepositories();
    this.#createApplicationServices();
    this.#createWorkerRuntime();

    this.mongoIndexManager = new MongoIndexManager({
      analysisRepository: this.analysisRepository,
      auditRepository: this.auditRepository,
      entryRepository: this.entryRepository,
      jobQueue: this.jobQueue,
    });

    this.apiRouter = new ApiRouterFactory({
      administrationService: this.administrationService,
      auditService: this.auditService,
      entryService: this.entryService,
      similarityService: this.similarityService,
    }).createRouter();

    this.application = new Application({
      apiRouter: this.apiRouter,
      applicationConfig: this.applicationConfig,
      healthMonitor: this.healthMonitor,
      logger: this.logger,
      openApiSpec,
    });
    this.server = new Server({
      application: this.application,
      host: this.applicationConfig.host,
      logger: this.logger,
      port: this.applicationConfig.port,
      shutdownTimeoutMs: this.applicationConfig.shutdownTimeoutMs,
    });
  }

  #createRepositories() {
    this.entryCollection = this.#collection(MongoEntryRepository.COLLECTION_NAME);
    this.analysisCollection = this.#collection(MongoAnalysisRepository.COLLECTION_NAME);
    this.auditCollection = this.#collection(MongoAuditRepository.COLLECTION_NAME);
    this.jobCollection = this.#collection(MongoJobQueue.COLLECTION_NAME);

    this.entryRepository = new MongoEntryRepository({ collection: this.entryCollection });
    this.analysisRepository = new MongoAnalysisRepository({
      collection: this.analysisCollection,
      entryRepository: this.entryRepository,
    });
    this.auditRepository = new MongoAuditRepository({ collection: this.auditCollection });
    this.jobRepository = new MongoJobRepository({ collection: this.jobCollection });
    this.jobQueue = new MongoJobQueue({
      collection: this.jobCollection,
      errorSerializer: new JobErrorSerializer(),
      jobFactory: new ProcessingJobFactory({ defaultMaxAttempts: this.queueConfig.maxAttempts }),
      leaseDurationMs: this.queueConfig.leaseDurationMs,
      retryPolicy: new JobRetryPolicy({ baseDelayMs: this.queueConfig.retryBaseDelayMs }),
    });
  }

  #createApplicationServices() {
    this.auditService = new AuditService({ auditRepository: this.auditRepository });
    this.jobService = new JobService({
      jobQueue: this.jobQueue,
      jobRepository: this.jobRepository,
      processingMetrics: this.processingMetrics,
    });
    this.entryService = new EntryService({
      analysisRepository: this.analysisRepository,
      auditService: this.auditService,
      entryRepository: this.entryRepository,
      jobService: this.jobService,
    });
    this.similarityService = new SimilarityService({ analysisRepository: this.analysisRepository });
    this.administrationService = new AdministrationService({
      entryRepository: this.entryRepository,
      healthMonitor: this.healthMonitor,
      jobService: this.jobService,
    });
  }

  #createWorkerRuntime() {
    const fullAnalysisPipeline = new FullAnalysisPipelineFactory().create(
      this.analysisConfiguration,
    );
    const riskEngine = new RiskEngineFactory().create(this.analysisConfiguration.risk);
    const complianceEvaluator = ComplianceEvaluator.fromConfiguration(
      this.analysisConfiguration.compliance,
    );
    const contextVersionManager = new ContextVersionManager(
      this.analysisConfiguration.versioning.context,
    );
    const processorRegistry = new JobProcessorRegistry([
      new FullAnalysisProcessor({
        analysisRepository: this.analysisRepository,
        entryRepository: this.entryRepository,
        fullAnalysisPipeline,
        modelDelayMs: this.processingConfig.modelDelayMs,
      }),
      new PartialRiskProcessor({
        analysisRepository: this.analysisRepository,
        complianceEvaluator,
        contextVersionManager,
        entryRepository: this.entryRepository,
        modelDelayMs: this.processingConfig.modelDelayMs,
        riskCalculator: riskEngine.riskCalculator,
        severityClassifier: riskEngine.severityClassifier,
      }),
      new ModelMigrationProcessor({
        analysisRepository: this.analysisRepository,
        entryRepository: this.entryRepository,
        fullAnalysisPipeline,
        modelDelayMs: this.processingConfig.modelDelayMs,
      }),
    ]);
    const workerId = 'worker-' + randomUUID();
    const jobLeaseManager = new JobLeaseManager({
      queue: this.jobQueue,
      renewalIntervalMs: Math.max(250, Math.floor(this.queueConfig.leaseDurationMs / 2)),
      workerId,
    });
    const workerRunner = new WorkerRunner({
      concurrency: this.processingConfig.workerConcurrency,
      idleBackoffMaxMs: this.queueConfig.idleBackoffMaxMs,
      jobLeaseManager,
      logger: this.logger.child({ process: 'worker-runtime' }),
      metrics: this.processingMetrics,
      pollIntervalMs: this.queueConfig.pollIntervalMs,
      processorRegistry,
      queue: this.jobQueue,
      workerId,
    });

    this.workerApplication = new WorkerApplication({
      logger: this.logger.child({ process: 'worker-application' }),
      metrics: this.processingMetrics,
      queue: this.jobQueue,
      runner: workerRunner,
    });
  }

  #collection(collectionName) {
    return new LazyMongoCollection({ collectionName, mongoConnection: this.mongoConnection });
  }

  #createApplicationConfig() {
    this.environmentConfig.getRequiredString('CORS_ORIGINS');

    return Object.freeze({
      corsOrigins: this.environmentConfig.getCsv('CORS_ORIGINS'),
      environment: this.environmentConfig.getEnum('NODE_ENV', [
        'development',
        'test',
        'production',
      ]),
      host: this.environmentConfig.getRequiredString('APP_HOST'),
      jsonLimit: this.environmentConfig.getOptionalString('APP_JSON_LIMIT', '1mb'),
      port: this.environmentConfig.getInteger('APP_PORT', {
        minimum: 1,
        maximum: 65535,
      }),
      shutdownTimeoutMs: this.environmentConfig.getInteger('APP_SHUTDOWN_TIMEOUT_MS', {
        defaultValue: 10000,
        minimum: 1000,
        maximum: 120000,
      }),
      version: packageMetadata.version,
    });
  }
}

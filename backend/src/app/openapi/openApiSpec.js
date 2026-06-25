export const openApiSpec = Object.freeze({
  info: {
    title: 'AI-Enriched Financial Audit Pipeline API',
    version: '1.0.0',
  },
  openapi: '3.1.0',
  paths: {
    '/api/entries': {
      get: {
        parameters: [
          'page',
          'pageSize',
          'sortBy',
          'sortDirection',
          'companyId',
          'dateFrom',
          'dateTo',
          'riskMin',
          'riskMax',
          'severity',
          'processingStatus',
        ],
        responses: { 200: { description: 'Paginated journal entry dashboard without vectors.' } },
        summary: 'List dashboard entries',
      },
      post: {
        requestBody: { required: true },
        responses: { 202: { description: 'Journal entry persisted and analysis job queued.' } },
        summary: 'Create journal entry',
      },
    },
    '/api/entries/{id}': {
      get: {
        responses: {
          200: { description: 'Journal entry with latest analysis and processing state.' },
          404: { description: 'Entry not found.' },
        },
        summary: 'Get journal entry detail',
      },
      put: {
        responses: {
          200: { description: 'Entry updated according to change classification.' },
          409: { description: 'Revision conflict.' },
        },
        summary: 'Update journal entry',
      },
    },
    '/api/entries/search/similar': {
      post: {
        requestBody: { required: true },
        responses: {
          200: { description: 'Top five similar entries by selected vector strategy.' },
        },
        summary: 'Similarity search',
      },
    },
    '/api/admin/model-migrations': {
      post: {
        responses: { 202: { description: 'Model migration jobs queued.' } },
        summary: 'Queue model migration',
      },
    },
    '/api/admin/risk-recalculations': {
      post: {
        responses: { 202: { description: 'Partial risk recalculation jobs queued.' } },
        summary: 'Queue partial risk recalculation',
      },
    },
    '/api/admin/queue/status': {
      get: { responses: { 200: { description: 'Queue status.' } }, summary: 'Queue status' },
    },
    '/api/admin/workers/status': {
      get: {
        responses: { 200: { description: 'Worker observability status.' } },
        summary: 'Worker status',
      },
    },
    '/api/admin/health': {
      get: {
        responses: { 200: { description: 'Application administration health.' } },
        summary: 'Administration health',
      },
    },
    '/api/audit/events': {
      get: { responses: { 200: { description: 'Audit event list.' } }, summary: 'Audit events' },
    },
    '/api/docs/openapi.json': {
      get: {
        responses: { 200: { description: 'OpenAPI specification.' } },
        summary: 'OpenAPI JSON',
      },
    },
  },
});

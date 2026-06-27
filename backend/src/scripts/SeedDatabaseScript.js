import { pathToFileURL } from 'node:url';

import { ScriptBootstrap } from '../bootstrap/ScriptBootstrap.js';

export class SeedDatabaseScript {
  constructor(container) {
    this.container = container;
    this.logger = container.logger.child({ process: 'seed' });
  }

  async execute() {
    const entries = this.#entries();
    const created = [];

    for (const entry of entries) {
      const result = await this.container.entryService.createEntry(entry, {
        actorId: 'seed-script',
        requestId: 'seed-' + entry.entryNo,
      });
      created.push(result);
    }

    this.logger.info(
      { createdCount: created.length, entries: created },
      'Seed data inserted and analysis jobs queued.',
    );
    return Object.freeze({ createdCount: created.length, entries: created });
  }

  #entries() {
    const batch = Date.now();

    return [
      this.#entry({
        amount: 1200,
        credit: 1200,
        debit: 1200,
        description: 'Standard office supplies purchase',
        entryNo: 'SEED-' + batch + '-001',
        glNumber: '400120',
        postingDate: '2026-06-25T10:05:00.000Z',
        transactionDate: '2026-06-25T10:00:00.000Z',
      }),
      this.#entry({
        amount: 250000,
        credit: 0,
        debit: 250000,
        description: 'Urgent manual override payment for vendor settlement',
        entryNo: 'SEED-' + batch + '-002',
        glNumber: '700999',
        postingDate: '2026-06-21T02:15:00.000Z',
        transactionDate: '2026-06-21T02:00:00.000Z',
      }),
      this.#entry({
        amount: 9800,
        credit: 9800,
        debit: 9800,
        description: 'Monthly SaaS subscription accrual',
        entryNo: 'SEED-' + batch + '-003',
        glNumber: '510210',
        postingDate: '2026-06-24T13:05:00.000Z',
        transactionDate: '2026-06-24T13:00:00.000Z',
      }),
      this.#entry({
        amount: 50000,
        credit: 49900,
        debit: 50000,
        description: 'Suspense clearing entry requiring review',
        entryNo: 'SEED-' + batch + '-004',
        glNumber: '999001',
        postingDate: '2026-06-23T16:10:00.000Z',
        transactionDate: '2026-06-23T16:00:00.000Z',
      }),
      this.#entry({
        amount: 3200,
        credit: 3200,
        debit: 3200,
        description: 'Travel reimbursement journal entry',
        entryNo: 'SEED-' + batch + '-005',
        glNumber: '610300',
        postingDate: '2026-06-22T09:30:00.000Z',
        transactionDate: '2026-06-22T09:15:00.000Z',
      }),
    ];
  }

  #entry(overrides) {
    return {
      accountId: 'seed-account',
      companyId: 'seed-company',
      currency: 'USD',
      transactionType: 'Journal Entry',
      userId: 'seed-user',
      ...overrides,
    };
  }

  static async launch() {
    const bootstrap = new ScriptBootstrap();
    await bootstrap.run(new SeedDatabaseScript(bootstrap.container));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await SeedDatabaseScript.launch();
}

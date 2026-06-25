import { EntityVectorGenerator } from './EntityVectorGenerator.js';
import { FinancialVectorGenerator } from './FinancialVectorGenerator.js';
import { SemanticVectorGenerator } from './SemanticVectorGenerator.js';

export class VectorEngineFactory {
  create(configuration) {
    return Object.freeze({
      entityVectorGenerator: new EntityVectorGenerator({
        length: configuration.entityLength,
      }),
      financialVectorGenerator: new FinancialVectorGenerator({
        amountScale: configuration.amountScale,
        glNumberScale: configuration.glNumberScale,
        length: configuration.financialLength,
      }),
      semanticVectorGenerator: new SemanticVectorGenerator({
        length: configuration.semanticLength,
      }),
    });
  }
}

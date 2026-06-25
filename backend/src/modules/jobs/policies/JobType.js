export class JobType {
  static FULL_ANALYSIS = 'full_analysis';

  static PARTIAL_RISK = 'partial_risk';

  static MODEL_MIGRATION = 'model_migration';

  static ALL = Object.freeze([
    JobType.FULL_ANALYSIS,
    JobType.PARTIAL_RISK,
    JobType.MODEL_MIGRATION,
  ]);
}

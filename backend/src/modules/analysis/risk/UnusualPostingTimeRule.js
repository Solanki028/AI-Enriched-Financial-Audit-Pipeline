export class UnusualPostingTimeRule {
  constructor(configuration) {
    this.id = 'unusual_posting_time';
    this.enabled = configuration.enabled;
    this.weight = configuration.weight;
    this.startHour = configuration.startHour;
    this.endHour = configuration.endHour;
    this.weekendDays = new Set(configuration.weekendDays);
  }

  evaluate(entry) {
    const postingDate = new Date(entry.postingDate);
    const day = postingDate.getUTCDay();
    const hour = postingDate.getUTCHours();
    const isWeekend = this.weekendDays.has(day);
    const isUnusualHour = this.#isWithinWindow(hour);

    return Object.freeze({
      fields: Object.freeze(['postingDate']),
      metadata: Object.freeze({
        day,
        hour,
        isUnusualHour,
        isWeekend,
        timezone: 'UTC',
      }),
      triggered: isWeekend || isUnusualHour,
    });
  }

  #isWithinWindow(hour) {
    if (this.startHour <= this.endHour) {
      return hour >= this.startHour && hour <= this.endHour;
    }

    return hour >= this.startHour || hour <= this.endHour;
  }
}

export class UnusualPostingTimeDetector {
  constructor({ endHour, severity, startHour, weekendDays }) {
    this.endHour = endHour;
    this.severity = severity;
    this.startHour = startHour;
    this.weekendDays = new Set(weekendDays);
  }

  detect(entry) {
    const postingDate = new Date(entry.postingDate);
    const day = postingDate.getUTCDay();
    const hour = postingDate.getUTCHours();
    const isWeekend = this.weekendDays.has(day);
    const isUnusualHour = this.#isWithinWindow(hour);

    if (!isWeekend && !isUnusualHour) {
      return null;
    }

    return Object.freeze({
      field: 'postingDate',
      message: 'Posting date occurs during a configured unusual time period.',
      metadata: Object.freeze({
        day,
        hour,
        isUnusualHour,
        isWeekend,
        timezone: 'UTC',
      }),
      severity: this.severity,
      type: 'unusual_posting_time',
    });
  }

  #isWithinWindow(hour) {
    if (this.startHour <= this.endHour) {
      return hour >= this.startHour && hour <= this.endHour;
    }

    return hour >= this.startHour || hour <= this.endHour;
  }
}

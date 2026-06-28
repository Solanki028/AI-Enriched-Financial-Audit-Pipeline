export class Formatters {
  static currency(value, currency = 'USD') {
    if (!Number.isFinite(Number(value))) {
      return '—';
    }

    return new Intl.NumberFormat(undefined, {
      currency,
      style: 'currency',
    }).format(Number(value));
  }

  static date(value) {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  static percent(value) {
    if (!Number.isFinite(Number(value))) {
      return '—';
    }

    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 1,
      style: 'percent',
    }).format(Number(value));
  }

  static score(value) {
    if (!Number.isFinite(Number(value))) {
      return '—';
    }

    return Number(value).toFixed(2);
  }
}

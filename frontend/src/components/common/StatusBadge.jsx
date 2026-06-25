import { Component } from 'react';

export class StatusBadge extends Component {
  render() {
    const value = this.props.value ?? 'unknown';
    const normalized = String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-');
    return <span className={'status-badge status-' + normalized}>{value}</span>;
  }
}

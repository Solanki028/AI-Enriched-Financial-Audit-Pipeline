import { Component } from 'react';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Formatters } from '../../utils/formatters.js';

export class EntryTable extends Component {
  render() {
    if (this.props.entries.length === 0) {
      return <div className="empty-state">No entries found.</div>;
    }

    return (
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Entry</th>
              <th>Company</th>
              <th>Amount</th>
              <th>Risk</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {this.props.entries.map((entry) => (
              <tr
                key={entry.entryId}
                onClick={() => this.props.onSelect(entry.entryId)}
              >
                <td>
                  <strong>{entry.entryId}</strong>
                  <span>{entry.description}</span>
                </td>
                <td>{entry.companyId}</td>
                <td>
                  {Formatters.currency(
                    entry.amount ?? entry.debit ?? entry.credit,
                    entry.currency,
                  )}
                </td>
                <td>{Formatters.score(entry.riskScore)}</td>
                <td>
                  <StatusBadge value={entry.severity ?? 'UNKNOWN'} />
                </td>
                <td>
                  <StatusBadge value={entry.processingStatus} />
                </td>
                <td>{entry.transactionDate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

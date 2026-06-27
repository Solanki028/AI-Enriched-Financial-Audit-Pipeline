import { Component } from 'react';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Formatters } from '../../utils/formatters.js';
import { AnalysisDetailPanel } from './AnalysisDetailPanel.jsx';
import { EntryUpdateForm } from './EntryUpdateForm.jsx';

export class EntryDetail extends Component {
  render() {
    const detail = this.props.detail;
    if (!detail) {
      return (
        <div className="empty-state">
          Select an entry to inspect analysis details.
        </div>
      );
    }

    const entry = detail.entry;
    const analysis = detail.analysis;
    return (
      <div className="entry-inspector">
        <div className="detail-grid">
          <article className="card">
            <h3>Journal Entry</h3>
            <dl>
              <dt>Entry ID</dt>
              <dd>{entry.entryId}</dd>
              <dt>Revision</dt>
              <dd>{entry.sourceRevision}</dd>
              <dt>Company</dt>
              <dd>{entry.companyId}</dd>
              <dt>Amount</dt>
              <dd>
                {Formatters.currency(
                  entry.amount ?? entry.debit,
                  entry.currency,
                )}
              </dd>
              <dt>Status</dt>
              <dd>
                <StatusBadge value={entry.processingStatus} />
              </dd>
            </dl>
          </article>
          <article className="card">
            <h3>Latest Analysis</h3>
            {analysis ? (
              <dl>
                <dt>Risk</dt>
                <dd>{Formatters.percent(analysis.riskScore)}</dd>
                <dt>Severity</dt>
                <dd>
                  <StatusBadge value={analysis.severity} />
                </dd>
                <dt>Source Revision</dt>
                <dd>{analysis.sourceRevision}</dd>
                <dt>Compliance</dt>
                <dd>
                  {analysis.compliance?.compliant
                    ? 'Compliant'
                    : 'Review required'}
                </dd>
              </dl>
            ) : (
              <p>Analysis has not completed yet.</p>
            )}
          </article>
        </div>
        <EntryUpdateForm
          entry={entry}
          onSubmit={this.props.onUpdate}
          submitting={this.props.updating}
        />
        <AnalysisDetailPanel analysis={analysis} />
      </div>
    );
  }
}

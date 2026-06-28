import { Component } from 'react';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Formatters } from '../../utils/formatters.js';

export class AnalysisDetailPanel extends Component {
  renderList(items, emptyMessage) {
    if (!items || items.length === 0) {
      return <p className="muted">{emptyMessage}</p>;
    }

    return (
      <ul className="analysis-list">
        {items.map((item, index) => (
          <li key={item.type ?? item.ruleId ?? item.code ?? index}>
            <strong>{item.type ?? item.ruleId ?? item.code ?? 'Item'}</strong>
            <span>
              {item.message ?? item.description ?? JSON.stringify(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  renderTriggeredRules(rules) {
    if (!rules || rules.length === 0) {
      return <p className="muted">No risk rules triggered.</p>;
    }

    return (
      <ul className="analysis-list">
        {rules.map((item, index) => {
          let title = item.rule;
          let description = `Weight: ${item.weight}`;

          if (item.rule === 'debit_credit_mismatch') {
            title = 'Debit/Credit Mismatch';
            description = `Debit (${Formatters.currency(item.metadata?.debit)}) and Credit (${Formatters.currency(item.metadata?.credit)}) do not balance. Difference is ${Formatters.currency(item.metadata?.difference)}.`;
          } else if (item.rule === 'unusually_large_amount') {
            title = 'Unusually Large Amount';
            description = `Entry amount (${Formatters.currency(item.metadata?.absoluteAmount)}) exceeds threshold limit of ${Formatters.currency(item.metadata?.threshold)}.`;
          } else if (item.rule === 'suspicious_description') {
            title = 'Suspicious Description';
            description = `Description contains audit flag terms: ${item.metadata?.matchedTerms?.join(', ') || ''}.`;
          } else if (item.rule === 'unusual_posting_time') {
            title = 'Unusual Posting Time';
            description = `Audit flag: Entry posted on hour ${item.metadata?.hour}:00 UTC (Weekend: ${item.metadata?.isWeekend ? 'Yes' : 'No'}).`;
          }

          return (
            <li key={item.rule ?? index}>
              <strong>{title}</strong>
              <span>{description}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  renderVectorSummary(analysis) {
    const vectors = [
      ['Semantic', analysis.semanticVector],
      ['Financial', analysis.financialVector],
      ['Entity', analysis.entityVector],
    ];

    return (
      <div className="vector-summary">
        {vectors.map(([label, vector]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{Array.isArray(vector) ? vector.length : 0} dims</strong>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const analysis = this.props.analysis;
    if (!analysis) {
      return <div className="empty-state">Analysis is not available yet.</div>;
    }

    return (
      <div className="analysis-panel">
        <article className="card">
          <h3>Risk Summary</h3>
          <div className="metric-grid">
            <div className="metric-card">
              <span>Risk Score</span>
              <strong>{Formatters.score(analysis.riskScore)}</strong>
            </div>
            <div className="metric-card">
              <span>Severity</span>
              <StatusBadge value={analysis.severity} />
            </div>
            <div className="metric-card">
              <span>Revision</span>
              <strong>{analysis.sourceRevision}</strong>
            </div>
          </div>
        </article>
        <article className="card">
          <h3>Anomalies</h3>
          {this.renderList(analysis.anomalies, 'No anomalies detected.')}
        </article>
        <article className="card">
          <h3>Triggered Risk Rules</h3>
          {this.renderTriggeredRules(analysis.triggeredRules)}
        </article>
        <article className="card">
          <h3>Compliance</h3>
          <p>
            <StatusBadge
              value={
                analysis.compliance?.compliant ? 'compliant' : 'review_required'
              }
            />
          </p>
          <h4>Violations</h4>
          {this.renderList(analysis.compliance?.violations, 'No violations.')}
          <h4>Warnings</h4>
          {this.renderList(analysis.compliance?.warnings, 'No warnings.')}
        </article>
        <article className="card span-2">
          <h3>Vector Summary</h3>
          {this.renderVectorSummary(analysis)}
        </article>
      </div>
    );
  }
}

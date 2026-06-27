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
              <strong>{Formatters.percent(analysis.riskScore)}</strong>
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
          {this.renderList(analysis.triggeredRules, 'No risk rules triggered.')}
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

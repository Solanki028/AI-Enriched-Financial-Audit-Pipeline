import { Component } from 'react';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { PageSection } from '../components/layout/PageSection.jsx';
import { Formatters } from '../utils/formatters.js';

export class AuditPage extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, events: [], loading: true };
  }

  async componentDidMount() {
    try {
      const events = await this.props.auditService.listEvents({});
      this.setState({ events, loading: false });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  }

  render() {
    return (
      <PageSection kicker="Traceability" title="Audit Events">
        <ErrorMessage error={this.state.error} />
        {this.state.loading ? <LoadingState /> : null}
        <div className="result-list">
          {this.state.events.map((event) => (
            <article className="card" key={event.auditEventId}>
              <strong>{event.action}</strong>
              <span>{event.entryId}</span>
              <p>{Formatters.date(event.occurredAt)}</p>
            </article>
          ))}
        </div>
      </PageSection>
    );
  }
}

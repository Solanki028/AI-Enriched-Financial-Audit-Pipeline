import { Component } from 'react';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { AdminPanel } from '../components/admin/AdminPanel.jsx';
import { PageSection } from '../components/layout/PageSection.jsx';

export class AdminPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: true,
      queueStatus: null,
      result: null,
      workerStatus: null,
    };
  }

  componentDidMount() {
    this.loadStatus();
  }

  async loadStatus() {
    try {
      const [queueStatus, workerStatus] = await Promise.all([
        this.props.adminService.getQueueStatus(),
        this.props.adminService.getWorkerStatus(),
      ]);
      this.setState({ loading: false, queueStatus, workerStatus });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  }

  triggerRiskRecalculation = async (payload) => {
    try {
      const result =
        await this.props.adminService.triggerRiskRecalculation(payload);
      this.setState({ result });
      await this.loadStatus();
    } catch (error) {
      this.setState({ error });
    }
  };

  triggerModelMigration = async (payload) => {
    try {
      const result =
        await this.props.adminService.triggerModelMigration(payload);
      this.setState({ result });
      await this.loadStatus();
    } catch (error) {
      this.setState({ error });
    }
  };

  render() {
    return (
      <PageSection kicker="Operations" title="Administration">
        <ErrorMessage error={this.state.error} />
        {this.state.result ? (
          <div className="alert alert-success">
            Queued jobs: {this.state.result.enqueued}
          </div>
        ) : null}
        {this.state.loading ? (
          <LoadingState />
        ) : (
          <AdminPanel
            queueStatus={this.state.queueStatus}
            workerStatus={this.state.workerStatus}
            onRiskRecalculation={this.triggerRiskRecalculation}
            onModelMigration={this.triggerModelMigration}
          />
        )}
      </PageSection>
    );
  }
}

import { Component } from 'react';

export class AdminPanel extends Component {
  constructor(props) {
    super(props);
    this.state = { entryIds: '', migrationVersion: 'v1.0' };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  entryIds() {
    return this.state.entryIds
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  render() {
    return (
      <div className="admin-grid">
        <article className="card">
          <h3>Queue Status</h3>
          <pre>{JSON.stringify(this.props.queueStatus, null, 2)}</pre>
        </article>
        <article className="card">
          <h3>Worker Status</h3>
          <pre>{JSON.stringify(this.props.workerStatus, null, 2)}</pre>
        </article>
        <form
          className="form-card compact"
          onSubmit={(event) => {
            event.preventDefault();
            this.props.onRiskRecalculation({ entryIds: this.entryIds() });
          }}
        >
          <h3>Partial Risk Recalculation</h3>
          <label>
            Entry IDs, comma-separated
            <input
              name="entryIds"
              onChange={this.handleChange}
              value={this.state.entryIds}
            />
          </label>
          <button className="button primary" type="submit">
            Queue Recalculation
          </button>
        </form>
        <form
          className="form-card compact"
          onSubmit={(event) => {
            event.preventDefault();
            this.props.onModelMigration({
              entryIds: this.entryIds(),
              targetVersions: { risk: this.state.migrationVersion },
            });
          }}
        >
          <h3>Model Migration</h3>
          <label>
            Target Risk Version
            <input
              name="migrationVersion"
              onChange={this.handleChange}
              value={this.state.migrationVersion}
            />
          </label>
          <button className="button secondary" type="submit">
            Queue Migration
          </button>
        </form>
      </div>
    );
  }
}

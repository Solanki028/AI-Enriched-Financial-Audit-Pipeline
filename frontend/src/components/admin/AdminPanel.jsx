import { Component } from 'react';

export class AdminPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      entryIds: '',
      migrationScope: 'selected',
      recalculationScope: 'selected',
      versions: {
        anomaly: 'v1.0',
        compliance: 'v1.0',
        entityVector: 'v1.0',
        financialVector: 'v1.0',
        risk: 'v1.0',
        semanticVector: 'v1.0',
      },
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleVersionChange = (event) => {
    this.setState({
      versions: {
        ...this.state.versions,
        [event.target.name]: event.target.value,
      },
    });
  };

  entryIds() {
    return this.state.entryIds
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  buildCommand(scope) {
    if (scope === 'all') {
      return { scope: 'all' };
    }

    return { entryIds: this.entryIds() };
  }

  renderVersionInputs() {
    return Object.entries(this.state.versions).map(([name, value]) => (
      <label key={name}>
        {name}
        <input name={name} onChange={this.handleVersionChange} value={value} />
      </label>
    ));
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
            this.props.onRiskRecalculation(
              this.buildCommand(this.state.recalculationScope),
            );
          }}
        >
          <h3 className="span-2">Partial Risk Recalculation</h3>
          <label>
            Scope
            <select
              name="recalculationScope"
              onChange={this.handleChange}
              value={this.state.recalculationScope}
            >
              <option value="selected">Selected entries</option>
              <option value="all">All migration candidates</option>
            </select>
          </label>
          <label className="span-2">
            Entry IDs, comma-separated
            <textarea
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
              ...this.buildCommand(this.state.migrationScope),
              targetVersions: this.state.versions,
            });
          }}
        >
          <h3 className="span-2">Model Migration</h3>
          <label>
            Scope
            <select
              name="migrationScope"
              onChange={this.handleChange}
              value={this.state.migrationScope}
            >
              <option value="selected">Selected entries</option>
              <option value="all">All migration candidates</option>
            </select>
          </label>
          {this.renderVersionInputs()}
          <button className="button secondary" type="submit">
            Queue Migration
          </button>
        </form>
      </div>
    );
  }
}

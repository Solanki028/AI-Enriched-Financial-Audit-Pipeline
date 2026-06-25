import { Component } from 'react';

export class EntryFilters extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props.filters };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.onApply(this.state);
  };

  render() {
    return (
      <form className="filter-grid" onSubmit={this.handleSubmit}>
        <label>
          Company
          <input
            name="companyId"
            onChange={this.handleChange}
            value={this.state.companyId ?? ''}
          />
        </label>
        <label>
          Severity
          <select
            name="severity"
            onChange={this.handleChange}
            value={this.state.severity ?? ''}
          >
            <option value="">All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </label>
        <label>
          Status
          <select
            name="processingStatus"
            onChange={this.handleChange}
            value={this.state.processingStatus ?? ''}
          >
            <option value="">All</option>
            <option value="queued">Queued</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          Risk Min
          <input
            name="riskMin"
            onChange={this.handleChange}
            type="number"
            value={this.state.riskMin ?? ''}
          />
        </label>
        <label>
          Risk Max
          <input
            name="riskMax"
            onChange={this.handleChange}
            type="number"
            value={this.state.riskMax ?? ''}
          />
        </label>
        <button className="button primary" type="submit">
          Apply Filters
        </button>
      </form>
    );
  }
}

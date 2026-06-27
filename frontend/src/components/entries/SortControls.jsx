import { Component } from 'react';

export class SortControls extends Component {
  handleChange = (event) => {
    this.props.onSortChange({
      ...this.props.sort,
      [event.target.name]: event.target.value,
    });
  };

  render() {
    return (
      <div className="sort-controls">
        <label>
          Sort by
          <select
            name="sortBy"
            onChange={this.handleChange}
            value={this.props.sort.sortBy}
          >
            <option value="createdAt">Created At</option>
            <option value="transactionDate">Transaction Date</option>
            <option value="riskScore">Risk Score</option>
            <option value="severity">Severity</option>
            <option value="companyId">Company</option>
          </select>
        </label>
        <label>
          Direction
          <select
            name="sortDirection"
            onChange={this.handleChange}
            value={this.props.sort.sortDirection}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>
    );
  }
}

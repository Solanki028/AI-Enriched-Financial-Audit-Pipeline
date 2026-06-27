import { Component } from 'react';

export class PaginationControls extends Component {
  render() {
    const totalPages = Math.max(
      1,
      Math.ceil(this.props.total / this.props.pageSize),
    );
    const isFirstPage = this.props.page <= 1;
    const isLastPage = this.props.page >= totalPages;

    return (
      <div className="pagination-controls" aria-label="Dashboard pagination">
        <button
          className="button secondary"
          disabled={isFirstPage}
          onClick={() => this.props.onPageChange(this.props.page - 1)}
          type="button"
        >
          Previous
        </button>
        <span>
          Page {this.props.page} of {totalPages}
        </span>
        <button
          className="button secondary"
          disabled={isLastPage}
          onClick={() => this.props.onPageChange(this.props.page + 1)}
          type="button"
        >
          Next
        </button>
        <label>
          Page size
          <select
            onChange={(event) =>
              this.props.onPageSizeChange(Number(event.target.value))
            }
            value={this.props.pageSize}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </div>
    );
  }
}

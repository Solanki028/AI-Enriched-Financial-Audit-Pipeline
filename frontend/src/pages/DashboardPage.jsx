import { Component } from 'react';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { PageSection } from '../components/layout/PageSection.jsx';
import { EntryDetail } from '../components/entries/EntryDetail.jsx';
import { EntryFilters } from '../components/entries/EntryFilters.jsx';
import { EntryTable } from '../components/entries/EntryTable.jsx';
import { PaginationControls } from '../components/entries/PaginationControls.jsx';
import { SortControls } from '../components/entries/SortControls.jsx';

export class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: null,
      entries: [],
      error: null,
      filters: {},
      loading: true,
      page: 1,
      pageSize: 25,
      sort: { sortBy: 'createdAt', sortDirection: 'desc' },
      total: 0,
      updateResult: null,
      updating: false,
    };
  }

  componentDidMount() {
    this.loadEntries();
  }

  async loadEntries(
    filters = this.state.filters,
    page = this.state.page,
    pageSize = this.state.pageSize,
    sort = this.state.sort,
  ) {
    this.setState({
      error: null,
      filters,
      loading: true,
      page,
      pageSize,
      sort,
    });
    try {
      const result = await this.props.entryService.listEntries({
        ...filters,
        ...sort,
        page,
        pageSize,
      });
      this.setState({
        entries: result.items,
        loading: false,
        total: result.total,
      });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  }

  loadDetail = async (entryId) => {
    this.setState({ error: null, updateResult: null });
    try {
      const detail = await this.props.entryService.getEntry(entryId);
      this.setState({ detail });
    } catch (error) {
      this.setState({ error });
    }
  };

  handleFilterApply = (filters) => {
    this.loadEntries(filters, 1, this.state.pageSize, this.state.sort);
  };

  handleSortChange = (sort) => {
    this.loadEntries(this.state.filters, 1, this.state.pageSize, sort);
  };

  handlePageChange = (page) => {
    this.loadEntries(
      this.state.filters,
      page,
      this.state.pageSize,
      this.state.sort,
    );
  };

  handlePageSizeChange = (pageSize) => {
    this.loadEntries(this.state.filters, 1, pageSize, this.state.sort);
  };

  updateEntry = async (entryId, payload) => {
    this.setState({ error: null, updateResult: null, updating: true });
    try {
      const updateResult = await this.props.entryService.updateEntry(
        entryId,
        payload,
      );
      const detail = await this.props.entryService.getEntry(entryId);
      await this.loadEntries(
        this.state.filters,
        this.state.page,
        this.state.pageSize,
        this.state.sort,
      );
      this.setState({ detail, updateResult, updating: false });
    } catch (error) {
      this.setState({ error, updating: false });
    }
  };

  render() {
    return (
      <PageSection kicker="Operational dashboard" title="Journal Entries">
        <ErrorMessage error={this.state.error} />
        {this.state.updateResult ? (
          <div className="alert alert-success">
            Update queued: {this.state.updateResult.updateType}, revision{' '}
            {this.state.updateResult.sourceRevision}
          </div>
        ) : null}
        <EntryFilters
          filters={this.state.filters}
          onApply={this.handleFilterApply}
        />
        <SortControls
          sort={this.state.sort}
          onSortChange={this.handleSortChange}
        />
        {this.state.loading ? (
          <LoadingState />
        ) : (
          <EntryTable entries={this.state.entries} onSelect={this.loadDetail} />
        )}
        <PaginationControls
          page={this.state.page}
          pageSize={this.state.pageSize}
          total={this.state.total}
          onPageChange={this.handlePageChange}
          onPageSizeChange={this.handlePageSizeChange}
        />
        <p className="muted">Total entries: {this.state.total}</p>
        <EntryDetail
          detail={this.state.detail}
          onUpdate={this.updateEntry}
          updating={this.state.updating}
        />
      </PageSection>
    );
  }
}

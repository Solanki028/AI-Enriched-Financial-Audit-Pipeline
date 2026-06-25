import { Component } from 'react';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { PageSection } from '../components/layout/PageSection.jsx';
import { EntryDetail } from '../components/entries/EntryDetail.jsx';
import { EntryFilters } from '../components/entries/EntryFilters.jsx';
import { EntryTable } from '../components/entries/EntryTable.jsx';

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
      total: 0,
    };
  }

  componentDidMount() {
    this.loadEntries();
  }

  async loadEntries(filters = this.state.filters) {
    this.setState({ error: null, filters, loading: true });
    try {
      const result = await this.props.entryService.listEntries({
        ...filters,
        page: this.state.page,
        pageSize: this.state.pageSize,
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
    this.setState({ error: null });
    try {
      const detail = await this.props.entryService.getEntry(entryId);
      this.setState({ detail });
    } catch (error) {
      this.setState({ error });
    }
  };

  render() {
    return (
      <PageSection kicker="Operational dashboard" title="Journal Entries">
        <ErrorMessage error={this.state.error} />
        <EntryFilters
          filters={this.state.filters}
          onApply={(filters) => this.loadEntries(filters)}
        />
        {this.state.loading ? (
          <LoadingState />
        ) : (
          <EntryTable entries={this.state.entries} onSelect={this.loadDetail} />
        )}
        <p className="muted">Total entries: {this.state.total}</p>
        <EntryDetail detail={this.state.detail} />
      </PageSection>
    );
  }
}

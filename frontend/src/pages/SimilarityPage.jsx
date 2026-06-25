import { Component } from 'react';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { PageSection } from '../components/layout/PageSection.jsx';
import { SimilarityPanel } from '../components/similarity/SimilarityPanel.jsx';

export class SimilarityPage extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, results: [] };
  }

  search = async (payload) => {
    this.setState({ error: null });
    try {
      const result = await this.props.similarityService.searchSimilar(payload);
      this.setState({ results: result.results });
    } catch (error) {
      this.setState({ error });
    }
  };

  render() {
    return (
      <PageSection kicker="Vector search" title="Similarity Search">
        <ErrorMessage error={this.state.error} />
        <SimilarityPanel onSearch={this.search} results={this.state.results} />
      </PageSection>
    );
  }
}

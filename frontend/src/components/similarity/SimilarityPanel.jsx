import { Component } from 'react';

export class SimilarityPanel extends Component {
  constructor(props) {
    super(props);
    this.state = { entryId: '', strategy: 'semantic' };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSearch(this.state);
  };

  render() {
    return (
      <div className="stack">
        <form className="form-card compact" onSubmit={this.handleSubmit}>
          <label>
            Entry ID
            <input
              name="entryId"
              onChange={this.handleChange}
              required
              value={this.state.entryId}
            />
          </label>
          <label>
            Strategy
            <select
              name="strategy"
              onChange={this.handleChange}
              value={this.state.strategy}
            >
              <option value="semantic">Semantic</option>
              <option value="financial">Financial</option>
              <option value="entity">Entity</option>
            </select>
          </label>
          <button className="button primary" type="submit">
            Search Similar
          </button>
        </form>
        <div className="result-list">
          {(this.props.results ?? []).map((result) => (
            <article className="card" key={result.entryId}>
              <strong>{result.entryId}</strong>
              <span>
                Similarity: {(result.similarityScore * 100).toFixed(1)}%
              </span>
              <p>{result.entry?.description ?? 'No summary available'}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }
}

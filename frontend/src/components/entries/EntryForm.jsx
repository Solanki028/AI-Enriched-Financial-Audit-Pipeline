import { Component } from 'react';

export class EntryForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accountId: '',
      companyId: '',
      credit: '0',
      currency: 'USD',
      debit: '',
      description: '',
      transactionDate: new Date().toISOString().slice(0, 10),
    };
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit({
      ...this.state,
      credit: Number(this.state.credit),
      debit: Number(this.state.debit),
    });
  };

  render() {
    return (
      <form className="form-card" onSubmit={this.handleSubmit}>
        <label>
          Company ID
          <input
            name="companyId"
            onChange={this.handleChange}
            required
            value={this.state.companyId}
          />
        </label>
        <label>
          Account ID
          <input
            name="accountId"
            onChange={this.handleChange}
            required
            value={this.state.accountId}
          />
        </label>
        <label>
          Currency
          <input
            name="currency"
            onChange={this.handleChange}
            required
            value={this.state.currency}
          />
        </label>
        <label>
          Debit
          <input
            name="debit"
            onChange={this.handleChange}
            required
            type="number"
            value={this.state.debit}
          />
        </label>
        <label>
          Credit
          <input
            name="credit"
            onChange={this.handleChange}
            required
            type="number"
            value={this.state.credit}
          />
        </label>
        <label>
          Transaction Date
          <input
            name="transactionDate"
            onChange={this.handleChange}
            required
            type="date"
            value={this.state.transactionDate}
          />
        </label>
        <label className="span-2">
          Description
          <textarea
            name="description"
            onChange={this.handleChange}
            required
            value={this.state.description}
          />
        </label>
        <button
          className="button primary"
          disabled={this.props.submitting}
          type="submit"
        >
          {this.props.submitting ? 'Creating...' : 'Create Entry'}
        </button>
      </form>
    );
  }
}

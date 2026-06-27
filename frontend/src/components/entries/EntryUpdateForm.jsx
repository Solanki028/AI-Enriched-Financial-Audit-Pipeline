import { Component } from 'react';

export class EntryUpdateForm extends Component {
  constructor(props) {
    super(props);
    this.state = this.#initialState(props.entry);
  }

  componentDidUpdate(previousProps) {
    if (
      previousProps.entry?.entryId !== this.props.entry?.entryId ||
      previousProps.entry?.sourceRevision !== this.props.entry?.sourceRevision
    ) {
      this.setState(this.#initialState(this.props.entry));
    }
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit(this.props.entry.entryId, {
      amount: Number(this.state.amount),
      credit: Number(this.state.credit),
      debit: Number(this.state.debit),
      description: this.state.description,
      notes: this.state.notes,
    });
  };

  #initialState(entry) {
    return {
      amount: entry?.amount ?? entry?.debit ?? '',
      credit: entry?.credit ?? '',
      debit: entry?.debit ?? '',
      description: entry?.description ?? '',
      notes: entry?.notes ?? '',
    };
  }

  render() {
    if (!this.props.entry) {
      return null;
    }

    return (
      <form className="form-card update-form" onSubmit={this.handleSubmit}>
        <h3 className="span-2">Update Entry</h3>
        <label>
          Amount
          <input
            name="amount"
            onChange={this.handleChange}
            type="number"
            value={this.state.amount}
          />
        </label>
        <label>
          Debit
          <input
            name="debit"
            onChange={this.handleChange}
            type="number"
            value={this.state.debit}
          />
        </label>
        <label>
          Credit
          <input
            name="credit"
            onChange={this.handleChange}
            type="number"
            value={this.state.credit}
          />
        </label>
        <label className="span-2">
          Description
          <textarea
            name="description"
            onChange={this.handleChange}
            value={this.state.description}
          />
        </label>
        <label className="span-2">
          Notes metadata
          <textarea
            name="notes"
            onChange={this.handleChange}
            value={this.state.notes}
          />
        </label>
        <button
          className="button primary"
          disabled={this.props.submitting}
          type="submit"
        >
          {this.props.submitting ? 'Updating...' : 'Update Entry'}
        </button>
      </form>
    );
  }
}

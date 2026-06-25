import { Component } from 'react';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { EntryForm } from '../components/entries/EntryForm.jsx';
import { PageSection } from '../components/layout/PageSection.jsx';

export class CreateEntryPage extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, result: null, submitting: false };
  }

  createEntry = async (payload) => {
    this.setState({ error: null, result: null, submitting: true });
    try {
      const result = await this.props.entryService.createEntry(payload);
      this.setState({ result, submitting: false });
    } catch (error) {
      this.setState({ error, submitting: false });
    }
  };

  render() {
    return (
      <PageSection kicker="Entry lifecycle" title="Create Journal Entry">
        <ErrorMessage error={this.state.error} />
        <EntryForm
          onSubmit={this.createEntry}
          submitting={this.state.submitting}
        />
        {this.state.result ? (
          <div className="alert alert-success">
            Entry queued: {this.state.result.entryId}
          </div>
        ) : null}
      </PageSection>
    );
  }
}

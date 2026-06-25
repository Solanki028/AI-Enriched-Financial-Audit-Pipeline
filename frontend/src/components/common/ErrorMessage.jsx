import { Component } from 'react';

export class ErrorMessage extends Component {
  render() {
    if (!this.props.error) {
      return null;
    }

    return (
      <div className="alert alert-error" role="alert">
        <strong>{this.props.error.errorCode ?? 'Error'}</strong>
        <span>{this.props.error.message}</span>
      </div>
    );
  }
}

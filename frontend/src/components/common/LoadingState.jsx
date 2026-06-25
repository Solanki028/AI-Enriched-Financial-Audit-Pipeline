import { Component } from 'react';

export class LoadingState extends Component {
  render() {
    return (
      <div className="loading-state">{this.props.message ?? 'Loading...'}</div>
    );
  }
}

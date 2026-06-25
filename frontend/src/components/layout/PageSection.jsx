import { Component } from 'react';

export class PageSection extends Component {
  render() {
    return (
      <section className="page-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">{this.props.kicker}</p>
            <h2>{this.props.title}</h2>
          </div>
          {this.props.actions}
        </div>
        {this.props.children}
      </section>
    );
  }
}

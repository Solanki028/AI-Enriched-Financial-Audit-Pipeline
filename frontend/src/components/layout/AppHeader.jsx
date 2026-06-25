import { Component } from 'react';

export class AppHeader extends Component {
  render() {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'create', label: 'Create Entry' },
      { id: 'similarity', label: 'Similarity' },
      { id: 'admin', label: 'Admin' },
      { id: 'audit', label: 'Audit' },
    ];

    return (
      <header className="app-header">
        <div>
          <p className="eyebrow">Financial Audit Pipeline</p>
          <h1>AI-Enriched Audit Console</h1>
        </div>
        <nav className="app-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={this.props.activePage === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => this.props.onNavigate(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
    );
  }
}

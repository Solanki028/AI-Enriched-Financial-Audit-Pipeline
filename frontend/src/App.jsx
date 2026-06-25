import { Component } from 'react';
import { AppHeader } from './components/layout/AppHeader.jsx';
import { ServiceContainer } from './services/ServiceContainer.js';
import { AdminPage } from './pages/AdminPage.jsx';
import { AuditPage } from './pages/AuditPage.jsx';
import { CreateEntryPage } from './pages/CreateEntryPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { SimilarityPage } from './pages/SimilarityPage.jsx';

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = { activePage: 'dashboard' };
    this.services = new ServiceContainer();
  }

  navigate = (activePage) => {
    this.setState({ activePage });
  };

  renderPage() {
    if (this.state.activePage === 'create') {
      return <CreateEntryPage entryService={this.services.entryService} />;
    }
    if (this.state.activePage === 'similarity') {
      return (
        <SimilarityPage similarityService={this.services.similarityService} />
      );
    }
    if (this.state.activePage === 'admin') {
      return <AdminPage adminService={this.services.adminService} />;
    }
    if (this.state.activePage === 'audit') {
      return <AuditPage auditService={this.services.auditService} />;
    }
    return <DashboardPage entryService={this.services.entryService} />;
  }

  render() {
    return (
      <div className="app-shell">
        <AppHeader
          activePage={this.state.activePage}
          onNavigate={this.navigate}
        />
        <main>{this.renderPage()}</main>
      </div>
    );
  }
}

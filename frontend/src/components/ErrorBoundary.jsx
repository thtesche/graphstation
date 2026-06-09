import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ef4444', background: '#0f172a', height: '100vh' }}>
          <h2>Graph Error</h2>
          <p>{this.props.error && `Error: ${this.props.error}`}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

import React, { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui';
import './ErrorBoundary.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrapper">
              <AlertTriangle size={36} />
            </div>
            <h2 className="error-boundary-title">
              Something went wrong
            </h2>
            <p className="error-boundary-text">
              An unexpected error occurred. Please try reloading the page or go back to home.
            </p>
            {this.state.error && (
              <pre className="error-boundary-pre">
                {this.state.error.message}
              </pre>
            )}
            <Button variant="primary" onClick={this.handleReset} className="w-full">
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

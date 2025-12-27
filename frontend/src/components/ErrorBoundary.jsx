// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        
        console.error('ErrorBoundary caught:', error, errorInfo);
        
        // ✅ Log which component crashed
        console.error(`Error in: ${this.props.componentName || 'Unknown Component'}`);
        
        // In production, send to error tracking:
        // if (process.env.dev.NODE_ENV === 'production') {
        //     Sentry.captureException(error, {
        //         tags: { component: this.props.componentName },
        //         extra: errorInfo
        //     });
        // }
    }

    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null 
        });
    }

    render() {
        if (this.state.hasError) {
            // ✅ Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // ✅ Default fallback with customizable content
            return (
                <section className={`error-boundary ${this.props.className || ''}`}>
                    <div className="error-container">
                        <i className="fa-solid fa-exclamation-triangle"></i>
                        
                        {/* ✅ Custom title via props */}
                        <h3>{this.props.title || 'Something went wrong'}</h3>
                        
                        {/* ✅ Custom message via props */}
                        <p className="error-message">
                            {this.props.message || this.state.error?.message || 'Unable to load this section'}
                        </p>
                        
                        <button 
                            className="reset-btn"
                            onClick={this.handleReset}
                        >
                            {this.props.resetText || 'Try Again'}
                        </button>
                        
                        {/* Show details only in development */}
                        {process.env.dev.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="error-details">
                                <summary>Error Details (Dev Only)</summary>
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            </details>
                        )}
                    </div>
                </section>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
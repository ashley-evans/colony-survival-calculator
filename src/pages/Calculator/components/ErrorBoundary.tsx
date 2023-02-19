import React, { Component, ReactElement, ReactNode } from "react";

type ErrorBoundaryProps = {
    children: ReactElement;
};

type ErrorBoundaryState = {
    error: string | undefined;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { error: undefined };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error: error.message };
    }

    render(): ReactNode {
        if (this.state.error) {
            return <p role="alert">Error: {this.state.error}</p>;
        }

        return this.props.children;
    }
}

export { ErrorBoundary };

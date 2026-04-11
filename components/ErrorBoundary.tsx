import React from 'react';
import { Pressable, Text, View } from 'react-native';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          backgroundColor: '#000',
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 18,
            fontFamily: 'PlusJakartaSansBold',
            textAlign: 'center',
          }}
        >
          {this.props.fallbackTitle ?? 'Something went wrong'}
        </Text>
        <Text
          style={{
            color: '#94a3b8',
            marginTop: 8,
            textAlign: 'center',
            fontFamily: 'PlusJakartaSans',
          }}
        >
          {this.props.fallbackMessage ?? 'Please try again.'}
        </Text>
        <Pressable
          onPress={this.handleRetry}
          style={{
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: '#cd2bee',
          }}
        >
          <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSansBold' }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }
}

export default ErrorBoundary;

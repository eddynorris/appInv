import { Alert } from 'react-native';

type ErrorLevel = 'error' | 'warning' | 'info';

export function handleError(error: unknown, context: string, level: ErrorLevel = 'error') {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  
  // Centralized logging
  console[level](`[${context}] ${message}`, error);
  
  // User-facing alerts for critical errors
  if (level === 'error') {
    Alert.alert('Error', `An error occurred in ${context}: ${message}`);
  }
}

export class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    handleError(error, `ErrorBoundary: ${info.componentStack}`);
  }

  render() {
    return this.state.hasError ? (
      <View style={styles.container}>
        <Text>Something went wrong. Please restart the app.</Text>
      </View>
    ) : this.props.children;
  }
}
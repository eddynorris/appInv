import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    console.error(message, err);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return { error, setError, handleError, clearError };
}
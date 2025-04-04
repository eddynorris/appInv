import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';

// Tipos para las alertas
export interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

// Tipo para el contexto
interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

// Crear el contexto
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Proveedor del contexto
export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Método para mostrar alertas
  const showAlert = (options: AlertOptions) => {
    const { title, message, buttons, type } = options;
    
    // Botones predeterminados si no se especifican
    const alertButtons = buttons || [
      { text: 'OK', style: 'default' }
    ];
    
    // Mostrar alerta nativa
    Alert.alert(title, message, alertButtons);
    
    // En el futuro se podría implementar notificaciones toast, snackbars, etc.
  };
  
  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe ser usado dentro de un AlertProvider');
  }
  return context;
};

export default AlertContext; 
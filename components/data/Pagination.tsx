import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  style?: ViewStyle;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  style,
}: PaginationProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // No mostrar paginación si solo hay una página o ninguna
  if (totalPages <= 1) {
    return null;
  }
  
  // Determinar qué páginas mostrar
  const getPageNumbers = () => {
    // Mostrar máximo 5 números de página a la vez
    const pages = [];
    
    if (totalPages <= 5) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre añadir la primera página
      pages.push(1);
      
      // Mostrar elipsis o páginas intermedias
      if (currentPage <= 3) {
        // Si estamos cerca del inicio, mostrar las primeras 4 páginas y luego elipsis
        pages.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Si estamos cerca del final, mostrar elipsis y las últimas 4 páginas
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Mostrar elipsis, la página actual y sus adyacentes, y otra elipsis
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };
  
  const pages = getPageNumbers();
  
  return (
    <ThemedView style={[styles.container, style]}>
      {/* Botón anterior */}
      <TouchableOpacity
        style={[
          styles.pageButton,
          currentPage === 1 && styles.disabled,
        ]}
        onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <AntDesign
          name="left"
          size={16}
          color={isDark ? (currentPage === 1 ? '#555555' : '#FFFFFF') : (currentPage === 1 ? '#CCCCCC' : '#000000')}
        />
      </TouchableOpacity>
      
      {/* Números de página */}
      {pages.map((page, index) => (
        <TouchableOpacity
          key={`page-${index}`}
          style={[
            styles.pageButton,
            page === currentPage && styles.activePage,
            page === '...' && styles.ellipsis,
          ]}
          onPress={() => typeof page === 'number' && page !== currentPage && onPageChange(page)}
          disabled={page === '...' || page === currentPage}
        >
          <ThemedText
            style={[
              styles.pageText,
              page === currentPage && styles.activePageText,
            ]}
          >
            {page}
          </ThemedText>
        </TouchableOpacity>
      ))}
      
      {/* Botón siguiente */}
      <TouchableOpacity
        style={[
          styles.pageButton,
          currentPage === totalPages && styles.disabled,
        ]}
        onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <AntDesign
          name="right"
          size={16}
          color={isDark ? (currentPage === totalPages ? '#555555' : '#FFFFFF') : (currentPage === totalPages ? '#CCCCCC' : '#000000')}
        />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activePage: {
    backgroundColor: '#2196F3',
  },
  activePageText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pageText: {
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  ellipsis: {
    backgroundColor: 'transparent',
  },
}); 
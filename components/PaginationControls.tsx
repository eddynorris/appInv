// components/PaginationControls.tsx
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  totalItems?: number;
}

export function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems
}: PaginationControlsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first and last page, and pages around current page
      if (currentPage <= 3) {
        // Current page is near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(null); // Ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Current page is near the end
        pages.push(1);
        pages.push(null); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Current page is in the middle
        pages.push(1);
        pages.push(null); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(null); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Info row with total items and current page */}
      <ThemedView style={styles.infoRow}>
        {totalItems !== undefined && (
          <ThemedText style={styles.totalItems}>
            {totalItems} registros en total
          </ThemedText>
        )}

        <ThemedText style={styles.pageInfo}>
          Página {currentPage} de {totalPages}
        </ThemedText>
      </ThemedView>
      
      {/* Pagination controls - always visible */}
      <ThemedView style={styles.paginationContainer}>
        {/* Previous button */}
        <TouchableOpacity 
          style={[
            styles.pageButton, 
            styles.navButton,
            currentPage === 1 && styles.disabledButton
          ]}
          onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <IconSymbol 
            name="chevron.left" 
            size={20} 
            color={currentPage === 1 ? '#9BA1A6' : Colors[colorScheme].tint} 
          />
        </TouchableOpacity>
        
        {/* Page numbers */}
        <View style={styles.pageNumbers}>
          {getPageNumbers().map((page, index) => {
            if (page === null) {
              // Render ellipsis
              return (
                <ThemedText key={`ellipsis-${index}`} style={styles.ellipsis}>...</ThemedText>
              );
            }
            
            return (
              <TouchableOpacity
                key={`page-${page}`}
                style={[
                  styles.pageButton,
                  currentPage === page && styles.activePageButton
                ]}
                onPress={() => onPageChange(page as number)}
                disabled={currentPage === page}
              >
                <ThemedText 
                  style={[
                    styles.pageButtonText,
                    currentPage === page && styles.activePageText
                  ]}
                >
                  {page}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Next button */}
        <TouchableOpacity 
          style={[
            styles.pageButton, 
            styles.navButton,
            currentPage === totalPages && styles.disabledButton
          ]}
          onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <IconSymbol 
            name="chevron.right" 
            size={20} 
            color={currentPage === totalPages ? '#9BA1A6' : Colors[colorScheme].tint} 
          />
        </TouchableOpacity>
      </ThemedView>
      
      {/* Items per page selector */}
      {itemsPerPage !== undefined && onItemsPerPageChange && (
        <ThemedView style={styles.itemsPerPageContainer}>
          <ThemedText style={styles.itemsPerPageLabel}>
            Registros por página:
          </ThemedText>
          {[10, 20, 50].map(value => (
            <TouchableOpacity
              key={`items-${value}`}
              style={[
                styles.itemsPerPageButton,
                itemsPerPage === value && styles.activeItemsPerPageButton
              ]}
              onPress={() => onItemsPerPageChange(value)}
              disabled={itemsPerPage === value}
            >
              <ThemedText 
                style={[
                  styles.itemsPerPageButtonText,
                  itemsPerPage === value && styles.activeItemsPerPageButtonText
                ]}
              >
                {value}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
    backgroundColor: '#f5f5f7', // Light background to make pagination stand out
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  totalItems: {
    fontSize: 14,
    color: '#687076',
  },
  pageInfo: {
    fontSize: 14,
    color: '#687076',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  activePageButton: {
    backgroundColor: '#0a7ea4',
  },
  pageButtonText: {
    fontSize: 14,
  },
  activePageText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  navButton: {
    borderWidth: 1,
    borderColor: '#E1E3E5',
    backgroundColor: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  ellipsis: {
    paddingHorizontal: 4,
  },
  itemsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  itemsPerPageLabel: {
    fontSize: 14,
    color: '#687076',
  },
  itemsPerPageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  activeItemsPerPageButton: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  itemsPerPageButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeItemsPerPageButtonText: {
    color: '#FFFFFF',
  },
});
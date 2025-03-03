import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationControlsProps) {
  // Don't render if there's only one page
  if (totalPages <= 1) {
    return null;
  }

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
          color={currentPage === 1 ? '#9BA1A6' : '#0a7ea4'} 
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
          color={currentPage === totalPages ? '#9BA1A6' : '#0a7ea4'} 
        />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  },
  disabledButton: {
    opacity: 0.5,
  },
  ellipsis: {
    paddingHorizontal: 4,
  },
});
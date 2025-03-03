// Add this to your components/DataTable.tsx file

import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PaginationControls } from '@/components/PaginationControls';

// Definimos interfaces para las columnas y los datos
export interface Column {
  id: string;
  label: string;
  width?: number;
  render?: (item: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  keyExtractor: (item: T) => string;
  baseRoute: string;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  baseRoute,
  isLoading,
  error,
  onRefresh,
  onLoadMore,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  sortColumn,
  sortOrder = 'asc',
  onSort,
  emptyMessage = 'No hay datos disponibles',
}: DataTableProps<T>) {
  const colorScheme = useColorScheme() ?? 'light';

  const renderHeader = () => (
    <ThemedView style={styles.header}>
      {columns.map((column) => (
        <TouchableOpacity 
          key={column.id}
          onPress={() => onSort && onSort(column.id)} 
          style={[styles.headerCell, column.width ? { flex: column.width } : {}]}
          disabled={!onSort}
        >
          <ThemedText type="defaultSemiBold">{column.label}</ThemedText>
          {sortColumn === column.id && onSort && (
            <IconSymbol
              name="chevron.right"
              size={14}
              color={Colors[colorScheme].icon}
              style={{ transform: [{ rotate: sortOrder === 'asc' ? '90deg' : '-90deg' }] }}
            />
          )}
        </TouchableOpacity>
      ))}
    </ThemedView>
  );

  const renderItem = ({ item }: { item: T }) => (
    <Link href={`${baseRoute}/${keyExtractor(item)}`} asChild>
      <TouchableOpacity>
        <ThemedView style={styles.row}>
          {columns.map((column) => (
            <ThemedView 
              key={column.id} 
              style={[styles.cell, column.width ? { flex: column.width } : {}]}
            >
              {column.render ? (
                column.render(item)
              ) : (
                <ThemedText numberOfLines={1}>
                  {(item[column.id as keyof T] as any)?.toString() || ''}
                </ThemedText>
              )}
            </ThemedView>
          ))}
        </ThemedView>
      </TouchableOpacity>
    </Link>
  );

  const renderFooter = () => {
    if (isLoading && data.length > 0) {
      return (
        <ThemedView style={styles.footer}>
          <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
        </ThemedView>
      );
    }

    if (onLoadMore && currentPage < totalPages && !onPageChange) {
      return (
        <TouchableOpacity onPress={onLoadMore} style={styles.loadMoreButton}>
          <ThemedText type="link">Cargar más</ThemedText>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (isLoading && data.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.emptyText}>Cargando datos...</ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <ThemedText type="link">Reintentar</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.emptyContainer}>
        <IconSymbol name="paperplane.fill" size={48} color={Colors[colorScheme].icon} />
        <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => keyExtractor(item)}
        onRefresh={onRefresh}
        refreshing={isLoading && data.length === 0 && !error}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : undefined}
      />

      {/* Add pagination controls */}
      {onPageChange && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E3E5',
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#E53935',
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
});
// components/DataTable.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, View, Alert } from 'react-native';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PaginationControls } from '@/components/PaginationControls';

// Define interfaces for columns and data
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
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  totalItems?: number;
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  emptyMessage?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  deletePrompt?: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
  };
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  baseRoute,
  isLoading,
  error,
  onRefresh,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  sortColumn,
  sortOrder = 'asc',
  onSort,
  emptyMessage = 'No hay datos disponibles',
  onEdit,
  onDelete,
  deletePrompt = {
    title: 'Confirmar Eliminación',
    message: '¿Está seguro que desea eliminar este elemento?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar'
  }
}: DataTableProps<T>) {
  const colorScheme = useColorScheme() ?? 'light';

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    } else {
      router.push(`${baseRoute}/edit/${id}`);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      deletePrompt.title,
      deletePrompt.message,
      [
        {
          text: deletePrompt.cancelText,
          style: 'cancel'
        },
        {
          text: deletePrompt.confirmText,
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(id);
            }
          }
        }
      ]
    );
  };

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

      {/* Acciones header */}
      {(onEdit || onDelete) && (
        <ThemedView style={styles.actionsHeader}>
          <ThemedText type="defaultSemiBold">Acciones</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  const renderItem = ({ item }: { item: T }) => (
    <ThemedView style={styles.row}>
      {/* Columnas de datos */}
      {columns.map((column) => (
        <TouchableOpacity 
          key={column.id} 
          style={[styles.cell, column.width ? { flex: column.width } : {}]}
          onPress={() => router.push(`${baseRoute}/${keyExtractor(item)}`)}
        >
          {column.render ? (
            column.render(item)
          ) : (
            <ThemedText numberOfLines={1}>
              {(item[column.id as keyof T] as any)?.toString() || ''}
            </ThemedText>
          )}
        </TouchableOpacity>
      ))}

      {/* Botones de acción */}
      {(onEdit || onDelete) && (
        <ThemedView style={styles.actionsCell}>
          {onEdit && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(keyExtractor(item))}
            >
              <IconSymbol name="pencil.fill" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(keyExtractor(item))}
            >
              <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );

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
      {/* Table header */}
      {renderHeader()}

      {/* Table body */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => keyExtractor(item)}
        onRefresh={onRefresh}
        refreshing={isLoading && data.length === 0 && !error}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : undefined}
      />

      {/* Pagination controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={onItemsPerPageChange}
        totalItems={totalItems}
      />
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
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionsHeader: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionsCell: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
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
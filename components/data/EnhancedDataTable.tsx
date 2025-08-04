// components/data/EnhancedDataTable.tsx
import React, { useMemo, useCallback, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PaginationControls } from '@/components/PaginationControls';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext'; // Importar el contexto de autenticación

// Column definition
export interface Column<T> {
  id: string;
  label: string;
  width?: number;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

// Data table props
interface EnhancedDataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  isLoading: boolean;
  error: string | null;
  baseRoute: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
  sorting?: {
    sortColumn: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: string) => void;
  };
  actions?: {
    onView?: boolean;
    onEdit?: boolean;
    onDelete?: boolean;
    customActions?: Array<{
      icon: string;
      color: string;
      onPress: (id: number | string) => void;
      label: string;
    }>;
  };
  deleteOptions?: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onDelete: (id: number | string) => Promise<boolean>;
  };
  emptyMessage?: string;
  onRefresh?: () => void;
  onRowPress?: (item: T) => void;
}

export function EnhancedDataTable<T extends { id: number | string, vendedor_id?: number | string }>({
  data,
  columns,
  isLoading,
  error,
  baseRoute,
  pagination,
  sorting,
  actions = { onView: true, onEdit: true, onDelete: true },
  deleteOptions,
  emptyMessage = 'No hay datos disponibles',
  onRefresh,
  onRowPress
}: EnhancedDataTableProps<T>) {
  const colorScheme = useColorScheme() ?? 'light';
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user } = useAuth(); // Obtener el usuario actual

  // Determinar permisos basados en el rol de usuario
  const isAdmin = user?.rol === 'admin';

  // Handle navigation to detail view - Siempre permitido
  const handleViewDetail = useCallback((id: number | string) => {
    router.push(`${baseRoute}/${id}`);
  }, [baseRoute]);

  // Handle navigation to edit view - Solo para admins
  const handleEdit = useCallback((id: number | string) => {
    if (!isAdmin) {
      Alert.alert("Acceso restringido", "No tienes permisos para editar ventas.");
      return;
    }
    router.push(`${baseRoute}/edit/${id}`);
  }, [baseRoute, isAdmin]);

  // Show delete confirmation - Solo para admins
  const handleDeleteClick = useCallback((id: number | string) => {
    if (!isAdmin) {
      Alert.alert("Acceso restringido", "No tienes permisos para eliminar ventas.");
      return;
    }
    setDeleteId(id);
    setShowDeleteDialog(true);
  }, [isAdmin]);

  // Execute delete action
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId || !deleteOptions || !isAdmin) return;
    
    try {
      setDeleteLoading(true);
      const success = await deleteOptions.onDelete(deleteId);
      
      if (!success) {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  }, [deleteId, deleteOptions, isAdmin]);

  // Determinar qué acciones mostrar basado en el rol
  const displayActions = useMemo(() => {
    return {
      onView: actions.onView, // Vista de detalle siempre permitida
      onEdit: isAdmin && actions.onEdit, // Editar solo para admin
      onDelete: isAdmin && actions.onDelete, // Eliminar solo para admin
      customActions: actions.customActions || [] // Acciones personalizadas
    };
  }, [actions, isAdmin]);

  // Memoized header component to prevent re-renders
  const TableHeader = useMemo(() => (
    <ThemedView style={styles.header}>
      {columns.map((column) => (
        <TouchableOpacity 
          key={column.id}
          style={[
            styles.headerCell, 
            column.width ? { flex: column.width } : {}
          ]}
          onPress={() => {
            if (column.sortable && sorting) {
              sorting.onSort(column.id);
            }
          }}
          disabled={!column.sortable || !sorting}
        >
          <ThemedText type="defaultSemiBold">{column.label}</ThemedText>
          {sorting && sorting.sortColumn === column.id && (
            <IconSymbol
              name="chevron.right"
              size={14}
              color={Colors[colorScheme].icon}
              style={{ transform: [{ rotate: sorting.sortOrder === 'asc' ? '90deg' : '-90deg' }] }}
            />
          )}
        </TouchableOpacity>
      ))}
      
      {/* Actions column if any actions enabled */}
      {(displayActions.onView || displayActions.onEdit || displayActions.onDelete || displayActions.customActions?.length) && (
        <View style={styles.actionsHeader}>
          <ThemedText type="defaultSemiBold">Acciones</ThemedText>
        </View>
      )}
    </ThemedView>
  ), [columns, sorting, displayActions, colorScheme]);

  // Render each row
  const renderItem = useCallback(({ item }: { item: T }) => {
    // Verifica si el usuario es el creador de la venta
    const isCreator = user?.id && item.vendedor_id && user.id.toString() === item.vendedor_id.toString();
    
    return (
      <ThemedView style={styles.row}>
        {columns.map((column) => (
          <TouchableOpacity
            key={`${item.id}-${column.id}`}
            style={[
              styles.cell,
              column.width ? { flex: column.width } : {}
            ]}
            onPress={() => {
              if (onRowPress) {
                onRowPress(item);
              } else {
                handleViewDetail(item.id);
              }
            }}
          >
            {column.render ? (
              column.render(item)
            ) : (
              <ThemedText numberOfLines={1}>
                {(item[column.id as keyof T] as any)?.toString() || '-'}
              </ThemedText>
            )}
          </TouchableOpacity>
        ))}
        
        {/* Action buttons - Solo mostrar las que correspondan según el rol */}
        {(displayActions.onView || displayActions.onEdit || displayActions.onDelete || displayActions.customActions?.length) && (
          <View style={styles.actionsCell}>
            {/* El botón de ver detalle siempre está disponible */}
            {displayActions.onView && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.info }]}
                onPress={() => handleViewDetail(item.id)}
              >
                <IconSymbol name="info.circle.fill" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {/* Editar solo para admin */}
            {displayActions.onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                onPress={() => handleEdit(item.id)}
              >
                <IconSymbol name="pencil.fill" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {/* Eliminar solo para admin */}
            {displayActions.onDelete && deleteOptions && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.danger }]}
                onPress={() => handleDeleteClick(item.id)}
              >
                <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            {/* Acciones personalizadas */}
            {displayActions.customActions?.map((action, index) => (
              <TouchableOpacity
                key={`custom-action-${index}`}
                style={[styles.actionButton, { backgroundColor: action.color }]}
                onPress={() => action.onPress(item.id)}
              >
                <IconSymbol name={action.icon} size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ThemedView>
    );
  }, [columns, displayActions, handleViewDetail, handleEdit, handleDeleteClick, deleteOptions, onRowPress, user]);

  // Memoized empty component
  const EmptyComponent = useMemo(() => {
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
          <IconSymbol name="exclamationmark.triangle" size={48} color={Colors[colorScheme].icon} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
              <ThemedText style={{ color: Colors.primary }}>Reintentar</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.emptyContainer}>
        <IconSymbol name="tray.fill" size={48} color={Colors[colorScheme].icon} />
        <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
      </ThemedView>
    );
  }, [isLoading, data.length, error, emptyMessage, colorScheme, onRefresh]);

  return (
    <ThemedView style={styles.container}>
      {/* Table header */}
      {TableHeader}
      
      {/* Table body */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={isLoading && data.length > 0}
        onRefresh={onRefresh}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : undefined}
      />
      
      {/* Pagination controls */}
      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.onPageChange}
        itemsPerPage={pagination.itemsPerPage}
        onItemsPerPageChange={pagination.onItemsPerPageChange}
        totalItems={pagination.totalItems}
      />
      
      {/* Delete confirmation dialog */}
      {deleteOptions && (
        <ConfirmationDialog
          visible={showDeleteDialog}
          title={deleteOptions.title}
          message={deleteOptions.message}
          confirmText={deleteOptions.confirmText}
          cancelText={deleteOptions.cancelText}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
          confirmButtonColor={Colors.danger}
          isLoading={deleteLoading}
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
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionsHeader: {
    width: 120,
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
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: Colors.danger,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
});
// components/data/EnhancedCardList.tsx
import React, { useCallback, useState, useMemo } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PaginationControls } from '@/components/PaginationControls';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

export interface EnhancedCardListProps<T extends { id: number | string }> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  baseRoute: string;
  renderCard: (item: T, onPress?: () => void) => React.ReactNode;
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
  onCardPress?: (item: T) => void;
  numColumns?: number; // Para soportar grid view
}

export function EnhancedCardList<T extends { id: number | string; vendedor_id?: number | string }>({
  data,
  isLoading,
  error,
  baseRoute,
  renderCard,
  pagination,
  sorting,
  actions = { onView: true, onEdit: true, onDelete: true },
  deleteOptions,
  emptyMessage = 'No hay datos disponibles',
  onRefresh,
  onCardPress,
  numColumns = 1
}: EnhancedCardListProps<T>) {
  const colorScheme = useColorScheme() ?? 'light';
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user } = useAuth();

  // Determinar permisos basados en el rol de usuario
  const isAdmin = user?.rol === 'admin';

  // Handle navigation to detail view - Siempre permitido
  const handleViewDetail = useCallback((id: number | string) => {
    router.push(`${baseRoute}/${id}`);
  }, [baseRoute]);

  // Handle navigation to edit view - Solo para admins
  const handleEdit = useCallback((id: number | string) => {
    if (!isAdmin) {
      Alert.alert("Acceso restringido", "No tienes permisos para editar este elemento.");
      return;
    }
    router.push(`${baseRoute}/edit/${id}`);
  }, [baseRoute, isAdmin]);

  // Show delete confirmation - Solo para admins
  const handleDeleteClick = useCallback((id: number | string) => {
    if (!isAdmin) {
      Alert.alert("Acceso restringido", "No tienes permisos para eliminar este elemento.");
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

  // Renderizar las acciones para cada tarjeta
  const renderActions = useCallback((item: T) => {
    // No renderizar acciones si ninguna está habilitada
    if (!displayActions.onView && !displayActions.onEdit && 
        !displayActions.onDelete && displayActions.customActions.length === 0) {
      return null;
    }

    return (
      <View style={styles.cardActions}>
        {/* Ver detalle - siempre disponible */}
        {displayActions.onView && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.info }]}
            onPress={() => handleViewDetail(item.id)}
          >
            <IconSymbol name="info.circle.fill" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {/* Editar - solo admin */}
        {displayActions.onEdit && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={() => handleEdit(item.id)}
          >
            <IconSymbol name="pencil.fill" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {/* Eliminar - solo admin */}
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
    );
  }, [displayActions, handleViewDetail, handleEdit, handleDeleteClick, deleteOptions]);

  // Render each card item
  const renderItem = useCallback(({ item }: { item: T }) => {
    const handlePress = () => {
      if (onCardPress) {
        onCardPress(item);
      } else {
        handleViewDetail(item.id);
      }
    };

    return (
      <View style={[styles.cardContainer, numColumns > 1 && styles.gridItem]}>
        <TouchableOpacity 
          style={styles.cardWrapper} 
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.card}>
            {/* Contenido principal de la tarjeta (renderizado por el consumidor) */}
            {renderCard(item, handlePress)}
            
            {/* Botones de acción en el pie de la tarjeta */}
            {renderActions(item)}
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [renderCard, renderActions, onCardPress, handleViewDetail, numColumns]);

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
      {/* Lista de tarjetas */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          data.length === 0 ? styles.emptyList : styles.contentContainer,
          numColumns > 1 && styles.gridContainer
        ]}
        refreshing={isLoading && data.length > 0}
        onRefresh={onRefresh}
        ListEmptyComponent={EmptyComponent}
        numColumns={numColumns}
        key={`list-${numColumns}`} // Forzar recreación al cambiar columnas
      />
      
      {/* Controles de paginación */}
      <PaginationControls
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.onPageChange}
        itemsPerPage={pagination.itemsPerPage}
        onItemsPerPageChange={pagination.onItemsPerPageChange}
        totalItems={pagination.totalItems}
      />
      
      {/* Diálogo de confirmación para eliminar */}
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
  contentContainer: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    flex: 1,
    flexDirection: 'column',
  },
  cardContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
    backgroundColor: '#F5F5F5',
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
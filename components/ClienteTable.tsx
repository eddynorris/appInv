import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Cliente } from '@/models/cliente';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ClienteTableProps {
  clientes: Cliente[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  currentPage: number;
  totalPages: number;
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function ClienteTable({
  clientes,
  isLoading,
  error,
  onRefresh,
  onLoadMore,
  currentPage,
  totalPages,
  sortColumn,
  sortOrder,
  onSort,
}: ClienteTableProps) {
  const colorScheme = useColorScheme() ?? 'light';

  const renderHeader = () => (
    <ThemedView style={styles.header}>
      <TouchableOpacity onPress={() => onSort('id')} style={styles.headerCell}>
        <ThemedText type="defaultSemiBold">ID</ThemedText>
        {sortColumn === 'id' && (
          <IconSymbol
            name="chevron.right"
            size={14}
            color={Colors[colorScheme].icon}
            style={{ transform: [{ rotate: sortOrder === 'asc' ? '90deg' : '-90deg' }] }}
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => onSort('nombre')} style={[styles.headerCell, styles.nombreCell]}>
        <ThemedText type="defaultSemiBold">Nombre</ThemedText>
        {sortColumn === 'nombre' && (
          <IconSymbol
            name="chevron.right"
            size={14}
            color={Colors[colorScheme].icon}
            style={{ transform: [{ rotate: sortOrder === 'asc' ? '90deg' : '-90deg' }] }}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onSort('telefono')} style={[styles.headerCell, styles.telefonoCell]}>
        <ThemedText type="defaultSemiBold">Teléfono</ThemedText>
        {sortColumn === 'telefono' && (
          <IconSymbol
            name="chevron.right"
            size={14}
            color={Colors[colorScheme].icon}
            style={{ transform: [{ rotate: sortOrder === 'asc' ? '90deg' : '-90deg' }] }}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onSort('saldo_pendiente')} style={styles.headerCell}>
        <ThemedText type="defaultSemiBold">Saldo</ThemedText>
        {sortColumn === 'saldo_pendiente' && (
          <IconSymbol
            name="chevron.right"
            size={14}
            color={Colors[colorScheme].icon}
            style={{ transform: [{ rotate: sortOrder === 'asc' ? '90deg' : '-90deg' }] }}
          />
        )}
      </TouchableOpacity>
    </ThemedView>
  );

  const renderClienteItem = ({ item }: { item: Cliente }) => (
    <Link href={`/clientes/${item.id}`} asChild>
      <TouchableOpacity>
        <ThemedView style={styles.row}>
          <ThemedText style={styles.cell}>{item.id}</ThemedText>
          <ThemedText style={[styles.cell, styles.nombreCell]}>{item.nombre}</ThemedText>
          <ThemedText style={[styles.cell, styles.telefonoCell]} numberOfLines={1}>{item.telefono}</ThemedText>
          <ThemedText style={styles.cell}>
            ${parseFloat(item.saldo_pendiente).toFixed(2)}
          </ThemedText>
        </ThemedView>
      </TouchableOpacity>
    </Link>
  );

  const renderFooter = () => {
    if (isLoading) {
      return (
        <ThemedView style={styles.footer}>
          <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
        </ThemedView>
      );
    }

    if (currentPage < totalPages) {
      return (
        <TouchableOpacity onPress={onLoadMore} style={styles.loadMoreButton}>
          <ThemedText type="link">Cargar más</ThemedText>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <ThemedText style={styles.emptyText}>Cargando clientes...</ThemedText>
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
        <ThemedText style={styles.emptyText}>No hay clientes disponibles</ThemedText>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={clientes}
        renderItem={renderClienteItem}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={onRefresh}
        refreshing={isLoading && currentPage === 1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={clientes.length === 0 ? { flex: 1 } : undefined}
      />

      <ThemedView style={styles.pagination}>
        <ThemedText>
          Página {currentPage} de {totalPages}
        </ThemedText>
      </ThemedView>
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
  },
  nombreCell: {
    flex: 2,
  },
  telefonoCell: {
    flex: 2,
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E3E5',
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
  loadMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
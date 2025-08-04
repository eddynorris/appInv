// components/ClienteSearchModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, StyleSheet, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import debounce from 'lodash.debounce';

import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { clienteApi } from '@/services';
import { ClienteSimple, Cliente } from '@/models';
import { ClienteFormModal } from './ClienteModal'; // Para crear nuevo cliente
 import { Colors } from '@/styles/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ActionButtons } from './buttons/ActionButtons';
import { FormStyles, Spacing } from '@/styles/Theme';

interface ClienteSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCliente: (cliente: ClienteSimple) => void;
  onClienteCreated: (cliente: Cliente) => void; // Callback cuando se crea un nuevo cliente
  initialClientes: ClienteSimple[]; // Recibir lista inicial de clientes
}

export function ClienteSearchModal({
  visible,
  onClose,
  onSelectCliente,
  onClienteCreated,
  initialClientes // Usar la prop
}: ClienteSearchModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  // No necesitamos estado local `clientes` ni `isLoading`/`error` para búsqueda API
  // const [clientes, setClientes] = useState<ClienteSimple[]>([]);
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // // Función para buscar clientes (YA NO SE USA)
  // const buscarClientes = useCallback(async (term: string) => { ... }, []);
  // const debouncedSearch = useCallback(debounce(buscarClientes, 300), [buscarClientes]);

  // Filtrar localmente la lista recibida
  const clientesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) {
      return initialClientes; // Mostrar todos si no hay búsqueda
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return initialClientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(lowerCaseSearch) ||
      cliente.telefono?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm, initialClientes]);

  // Resetear searchTerm al cerrar
  useEffect(() => {
    if (!visible) {
      setSearchTerm('');
    }
  }, [visible]);

   // Manejar creación de nuevo cliente
  const handleClienteCreatedInternal = (newCliente: Cliente) => {
      setShowCreateModal(false); // Cerrar modal de creación
      onClienteCreated(newCliente); // Notificar al padre (usePedidoItem)
  };

  // Función para manejar la selección de un cliente de la lista
  const handleSelect = (cliente: ClienteSimple) => {
    // *** RE-ASEGURARSE DE PASAR EL OBJETO COMPLETO ***
    onSelectCliente(cliente); // <-- Pasar el objeto cliente
    onClose();
  };

  const renderClienteItem = ({ item }: { item: ClienteSimple }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item)}>
      <View style={styles.itemContent}>
          <IconSymbol name="person.fill" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
          <View style={styles.itemTextContainer}>
              <ThemedText style={styles.itemNombre}>{item.nombre}</ThemedText>
              {item.telefono && <ThemedText style={styles.itemTelefono}>{item.telefono}</ThemedText>}
          </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Buscar Cliente</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={20} color="#757575" />
            <TextInput
              style={[styles.searchInput, { color: isDark ? Colors.dark.text : Colors.light.text }]}
              placeholder="Buscar por nombre o teléfono..."
              placeholderTextColor="#9E9E9E"
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoFocus
            />
             {searchTerm !== '' && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <IconSymbol name="xmark.circle.fill" size={20} color="#757575" />
                </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={clientesFiltrados}
            renderItem={renderClienteItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
               <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>
                      {initialClientes.length === 0
                       ? 'No hay clientes cargados'
                       : 'No se encontraron clientes con ese término'}
                  </ThemedText>
               </View>
            }
            style={styles.list}
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <IconSymbol name="plus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>Nuevo Cliente</ThemedText>
          </TouchableOpacity>

        </ThemedView>
      </View>

       {/* Modal para crear nuevo cliente */}
        <ClienteFormModal
            visible={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onClienteCreated={handleClienteCreatedInternal}
        />

    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 45,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  list: {
      maxHeight: 300, // Limitar altura de la lista
      marginBottom: 16,
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    marginBottom: 4,
  },
   itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemTextContainer: {
        marginLeft: 12,
    },
  itemNombre: {
    fontSize: 16,
    fontWeight: '500',
  },
   itemTelefono: {
        fontSize: 14,
        color: '#666',
    },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    textAlign: 'center',
    color: Colors.danger,
    marginVertical: 20,
    },
  emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    marginTop: 10,
    fontSize: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8, // Separar del listado
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
import React, { useState, useCallback, useEffect } from 'react';
import { View, Picker, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/ui/IconSymbol';

const [clienteSearch, setClienteSearch] = useState('');
const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
const [showClientesDropdown, setShowClientesDropdown] = useState(false);

const filtrarClientes = useCallback((texto: string) => {
  setClienteSearch(texto);
  if (!texto.trim()) {
    setClientesFiltrados([]);
    setShowClientesDropdown(false);
    return;
  }
  
  const filtrados = clientes.filter(cliente => 
    cliente.nombre.toLowerCase().includes(texto.toLowerCase())
  );
  
  setClientesFiltrados(filtrados);
  setShowClientesDropdown(true);
}, [clientes]);

const seleccionarCliente = useCallback((cliente: any) => {
  form.handleChange('cliente_id', cliente.id.toString());
  setClienteSearch(cliente.nombre);
  setShowClientesDropdown(false);
}, [form]);

useEffect(() => {
  if (form.formData.cliente_id && !clienteSearch) {
    const clienteSeleccionado = clientes.find(c => c.id.toString() === form.formData.cliente_id);
    if (clienteSeleccionado) {
      setClienteSearch(clienteSeleccionado.nombre);
    }
  }
}, [form.formData.cliente_id, clientes, clienteSearch]);

{/* Almacén - Bloquear para no admin */}
<View style={[
  styles.inputContainer,
  { backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9' },
  form.errors.almacen_id && styles.inputError
]}>
  <Picker
    selectedValue={form.formData.almacen_id}
    onValueChange={(value) => handleAlmacenChange(value)}
    style={styles.picker}
    enabled={!isLoading && user?.rol === 'admin'}
    dropdownIconColor={isDark ? '#FFFFFF' : '#666666'}
  >
    {almacenes.map(almacen => (
      <Picker.Item 
        key={almacen.id} 
        label={almacen.nombre} 
        value={almacen.id.toString()} 
      />
    ))}
  </Picker>
</View>

{/* Sección de cliente con buscador */}
<ThemedText style={styles.label}>Cliente</ThemedText>
{form.formData.cliente_id && clienteSearch ? (
  <View style={styles.selectedClienteContainer}>
    <View style={styles.selectedClienteInfo}>
      <ThemedText style={styles.selectedClienteNombre}>
        {clienteSearch}
      </ThemedText>
      <ThemedText style={styles.selectedClienteId}>
        ID: {form.formData.cliente_id}
      </ThemedText>
    </View>
    <TouchableOpacity 
      style={styles.changeClienteButton}
      onPress={() => {
        setShowClientesDropdown(true);
      }}
    >
      <ThemedText style={styles.changeClienteText}>Cambiar</ThemedText>
    </TouchableOpacity>
  </View>
) : (
  <View style={styles.searchContainer}>
    <TextInput
      style={[
        styles.input,
        form.errors.cliente_id && styles.inputError
      ]}
      placeholder="Buscar cliente por nombre..."
      placeholderTextColor="#9BA1A6"
      value={clienteSearch}
      onChangeText={filtrarClientes}
      onFocus={() => {
        if (clienteSearch.length > 0) {
          filtrarClientes(clienteSearch);
        }
      }}
      editable={!isLoading}
    />
    {clienteSearch.length > 0 && (
      <TouchableOpacity 
        style={styles.clearButton} 
        onPress={() => {
          setClienteSearch('');
          form.handleChange('cliente_id', '');
          setShowClientesDropdown(false);
        }}
      >
        <IconSymbol name="xmark.circle.fill" size={20} color="#9BA1A6" />
      </TouchableOpacity>
    )}
  </View>
)}

{showClientesDropdown && (
  <View style={[
    styles.dropdownContainer, 
    { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }
  ]}>
    {clientesFiltrados.length > 0 ? (
      <ScrollView style={styles.clientesList} nestedScrollEnabled={true}>
        {clientesFiltrados.map(cliente => (
          <TouchableOpacity
            key={cliente.id}
            style={[
              styles.clienteItem,
              { backgroundColor: form.formData.cliente_id === cliente.id.toString() ? '#e6f7ff' : 'transparent' }
            ]}
            onPress={() => seleccionarCliente(cliente)}
          >
            <ThemedText style={styles.clienteNombre}>{cliente.nombre}</ThemedText>
            {cliente.telefono && (
              <ThemedText style={styles.clienteInfo}>{cliente.telefono}</ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    ) : (
      <ThemedText style={styles.emptyResults}>
        {clienteSearch.length > 0 ? "No se encontraron clientes" : "Ingrese el nombre para buscar"}
      </ThemedText>
    )}
  </View>
)}

{form.errors.cliente_id && (
  <ThemedText style={styles.errorText}>{form.errors.cliente_id}</ThemedText>
)}

const styles = StyleSheet.create({
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    padding: 5,
  },
  dropdownContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clientesList: {
    padding: 8,
  },
  clienteItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '500',
  },
  clienteInfo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  emptyResults: {
    padding: 16,
    textAlign: 'center',
    color: '#999999',
  },
  selectedClienteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E1E3E5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8ff',
  },
  selectedClienteInfo: {
    flex: 1,
  },
  selectedClienteNombre: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedClienteId: {
    fontSize: 14,
    color: '#777777',
    marginTop: 2,
  },
  changeClienteButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  changeClienteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 
import { useMemo, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useEntityCRUD } from './useEntityCRUD';
import { clienteApi } from '@/services/api';
import { Cliente } from '@/models';
import { useForm } from '@/hooks/useForm';
import { ThemedText } from '@/components/ThemedText';

// Valores iniciales del formulario
const initialFormValues = {
  nombre: '',
  telefono: '',
  direccion: '',
};

// Reglas de validación para el formulario
const validationRules = {
  nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
  telefono: (value: string) => !value.trim() ? 'El teléfono es requerido' : null,
  direccion: (value: string) => !value.trim() ? 'La dirección es requerida' : null,
};

export function useClientes() {
  // Usar el hook genérico para CRUD
  const crudHook = useEntityCRUD({
    apiService: {
      getEntities: clienteApi.getClientes,
      getEntity: clienteApi.getCliente,
      createEntity: clienteApi.createCliente,
      updateEntity: clienteApi.updateCliente,
      deleteEntity: clienteApi.deleteCliente
    },
    entityName: 'cliente'
  });
  
  // Estado del formulario independiente
  const form = useForm(initialFormValues);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Definir columnas para la tabla (memoizadas)
  const columns = useMemo(() => [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
      sortable: true,
    },
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2,
      sortable: true,
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      width: 1,
      sortable: true,
    },
    {
      id: 'saldo_pendiente',
      label: 'Saldo',
      width: 1,
      sortable: true,
      render: (item: Cliente) => <ThemedText>${parseFloat(item.saldo_pendiente || '0').toFixed(2)}</ThemedText>,
    },
  ], []);
  
  // Cargar un cliente para edición
  const loadClienteForEdit = useCallback(async (id: number) => {
    // Evitar cargar el mismo cliente múltiples veces
    if (id === selectedId && form.formData.nombre) {
      return crudHook.entity;
    }
    
    setSelectedId(id);
    const cliente = await crudHook.loadEntity(id);
    
    if (cliente) {
      form.setValues({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
      });
      return cliente;
    } else {
      Alert.alert('Error', 'No se pudo cargar la información del cliente');
      return null;
    }
  }, [crudHook, form, selectedId]);
  
  // Crear un nuevo cliente
  const createCliente = useCallback(async () => {
    if (!form.validate(validationRules)) {
      return false;
    }
    
    try {
      const result = await crudHook.createEntity(form.formData);
      
      if (result) {
        Alert.alert(
          'Cliente Creado',
          'El cliente ha sido creado exitosamente',
          [{ text: 'OK', onPress: () => router.replace('/clientes') }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo crear el cliente');
        return false;
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al crear el cliente';
      Alert.alert('Error', errorMessage);
      return false;
    }
  }, [crudHook, form]);
  
  // Actualizar un cliente existente
  const updateCliente = useCallback(async (id: number) => {
    if (!form.validate(validationRules)) {
      return false;
    }
    
    try {
      const result = await crudHook.updateEntity(id, form.formData);
      
      if (result) {
        Alert.alert(
          'Cliente Actualizado',
          'El cliente ha sido actualizado exitosamente',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return true;
      } else {
        Alert.alert('Error', 'No se pudo actualizar el cliente');
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al actualizar el cliente';
      Alert.alert('Error', errorMessage);
      return false;
    }
  }, [crudHook, form]);
  
  // Calcular estadísticas de clientes
  const getEstadisticas = useCallback(() => {
    const saldoTotal = crudHook.entities.reduce(
      (acc, cliente) => acc + parseFloat(cliente.saldo_pendiente || '0'), 
      0
    );
    
    return {
      saldoTotal,
      totalClientes: crudHook.pagination.totalItems
    };
  }, [crudHook.entities, crudHook.pagination.totalItems]);
  
  // Restablecer el formulario
  const resetForm = useCallback(() => {
    form.resetForm();
    setSelectedId(null);
  }, [form]);
  
  return {
    // Datos básicos de CRUD
    ...crudHook,
    
    // Formulario y validación
    form,
    validationRules,
    
    // Columnas para la tabla
    columns,
    
    // Funciones específicas
    loadClienteForEdit,
    createCliente,
    updateCliente,
    resetForm,
    getEstadisticas
  };
} 
// app/ventas/edit/[id].tsx - Versión optimizada
import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import VentaForm from '@/components/form/VentaForm';
import { useVentas } from '@/hooks/crud/useVentas';
import { useAuth } from '@/context/AuthContext';

export default function EditVentaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  // Determinar si el usuario es administrador
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hook para manejo de ventas
  const {
    formData,
    detalles,
    errors,
    isSubmitting,
    clientes,
    almacenes,
    loadRelatedData,
    handleChange,
    actualizarProducto,
    eliminarProducto,
    calcularTotal,
    actualizarVenta,
    loadVenta
  } = useVentas();
  
  // Efecto para verificar rol y cargar datos iniciales
  useEffect(() => {
    // Verificar si el usuario es administrador
    if (user) {
      const isUserAdmin = user.rol?.toLowerCase() === 'admin';
      setIsAdmin(isUserAdmin);
    }
    
    // Cargar datos para formulario (clientes, almacenes)
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Primero cargar listas de clientes y almacenes
        await loadRelatedData();
        
        // 2. Luego cargar los datos de la venta para edición
        if (id) {
          const venta = await loadVenta(parseInt(id));
          if (!venta) {
            Alert.alert('Error', 'No se pudo cargar la venta');
            router.back();
          }
        }
      } catch (error) {
        console.error('Error inicializando datos:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [id, user, loadRelatedData, loadVenta]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    if (id) {
      await actualizarVenta(parseInt(id));
    }
  }, [id, actualizarVenta]);
  
  return (
    <ScreenContainer
      title="Editar Venta"
      isLoading={isLoading}
      loadingMessage="Cargando datos de la venta..."
      scrollable={true}
    >
      <VentaForm
        formData={formData}
        detalles={detalles}
        errors={errors}
        isSubmitting={isSubmitting}
        clientes={clientes}
        almacenes={almacenes}
        presentaciones={[]} // No necesitamos presentaciones para edición
        presentacionesFiltradas={[]}
        isAdmin={isAdmin}
        isEditing={true}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        onAddProduct={() => {}} // No se pueden agregar productos en edición
        onUpdateProduct={actualizarProducto}
        onRemoveProduct={eliminarProducto}
        calcularTotal={calcularTotal}
      />
    </ScreenContainer>
  );
}
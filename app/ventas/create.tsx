// app/ventas/create.tsx - Solución con limpieza directa de productos
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { Stack, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import VentaForm from '@/components/form/VentaForm';
import ProductSelector from '@/components/ProductSelector';
import { useVentas } from '@/hooks/crud/useVentas';
import { useProductos } from '@/hooks/useProductos';
import { useAuth } from '@/context/AuthContext';

export default function CreateVentaScreen() {
  const { user } = useAuth();
  
  // Ref para controlar si ya hemos inicializado los productos
  const productosInicializados = useRef(false);
  
  // Estado para modal de selección de productos
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Determinar si el usuario es administrador
  const [isAdmin, setIsAdmin] = useState(false);

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
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    setDetalles, // Usamos setDetalles directamente en lugar de limpiarProductos
    calcularTotal,
    crearVenta,
    isLoadingRelated
  } = useVentas();
  
  // Hook para manejo de productos con configuración optimizada
  const {
    presentaciones,
    presentacionesFiltradas,
    isLoading: isLoadingPresentaciones,
    filtrarPorAlmacenId,
    cargarPresentaciones
  } = useProductos({ 
    filtrarPorAlmacen: true, 
    soloConStock: true,
    cargarAlInicio: false // Desactivamos carga automática para controlarla manualmente
  });
  
  // Efecto para cargar datos iniciales - se ejecuta una sola vez
  useEffect(() => {
    const inicializarDatos = async () => {
      console.log("Inicializando datos básicos de la pantalla");
      
      // Establecer rol de usuario
      if (user) {
        const isUserAdmin = user.rol?.toLowerCase() === 'admin';
        setIsAdmin(isUserAdmin);
      }
      
      // Cargar datos relacionados (clientes y almacenes)
      await loadRelatedData();
    };
    
    inicializarDatos();
  }, [user, loadRelatedData]);
  
  // Efecto para cargar productos cuando ya tenemos un almacén seleccionado
  useEffect(() => {
    const cargarProductosInicial = async () => {
      // Solo inicializar productos una vez y cuando tengamos un almacén seleccionado
      if (!productosInicializados.current && formData.almacen_id) {
        console.log(`Inicializando productos para almacén: ${formData.almacen_id}`);
        
        // Marcar como inicializado para evitar cargas duplicadas
        productosInicializados.current = true;
        
        // Cargar primero todas las presentaciones
        await cargarPresentaciones();
        
        // Luego filtrar por el almacén seleccionado
        await filtrarPorAlmacenId(formData.almacen_id);
      }
    };
    
    cargarProductosInicial();
  }, [formData.almacen_id, cargarPresentaciones, filtrarPorAlmacenId]);
  
  // Manejar cambio de almacén específicamente
  const handleAlmacenChange = useCallback(async (almacenId: string) => {
    console.log(`Cambiando almacén a: ${almacenId}`);
    
    // Si ya hay productos seleccionados, mostrar confirmación
    if (detalles.length > 0) {
      Alert.alert(
        "Cambio de almacén",
        "Al cambiar de almacén se eliminarán todos los productos seleccionados. ¿Desea continuar?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Continuar",
            onPress: async () => {
              // IMPORTANTE: Limpiar productos DIRECTAMENTE con setDetalles
              // en lugar de usar limpiarProductos()
              setDetalles([]);
              
              // Actualizar el almacén en el formulario
              handleChange('almacen_id', almacenId);
              
              // Filtrar productos para el nuevo almacén
              await filtrarPorAlmacenId(almacenId);
              
              // Log para verificar que realmente se están limpiando los productos
              console.log("Productos después de limpiar:", []);
            }
          }
        ]
      );
    } else {
      // No hay productos seleccionados, solo actualizar almacén
      handleChange('almacen_id', almacenId);
      
      // Filtrar productos para el nuevo almacén
      await filtrarPorAlmacenId(almacenId);
    }
  }, [handleChange, filtrarPorAlmacenId, detalles.length, setDetalles]);
  
  // Manejar selección de producto desde el modal
  const handleSelectProduct = useCallback((presentacionId: string) => {
    const presentacion = presentacionesFiltradas.find(p => p.id.toString() === presentacionId);
    if (presentacion) {
      agregarProducto(
        presentacionId,
        '1',
        presentacion.precio_venta || '0'
      );
    }
    setShowProductModal(false);
  }, [agregarProducto, presentacionesFiltradas]);
  
  return (
    <ScreenContainer
      title="Nueva Venta"
      isLoading={isLoadingRelated}
      loadingMessage="Cargando datos iniciales..."
      scrollable={true}
    >
      <VentaForm
        formData={formData}
        detalles={detalles}
        errors={errors}
        isSubmitting={isSubmitting}
        clientes={clientes}
        almacenes={almacenes}
        presentaciones={presentaciones}
        presentacionesFiltradas={presentacionesFiltradas}
        isAdmin={isAdmin}
        isEditing={false}
        isLoadingPresentaciones={isLoadingPresentaciones}
        onChange={handleChange}
        onAlmacenChange={handleAlmacenChange}
        onSubmit={crearVenta}
        onCancel={() => router.back()}
        onAddProduct={() => setShowProductModal(true)}
        onUpdateProduct={actualizarProducto}
        onRemoveProduct={eliminarProducto}
        calcularTotal={calcularTotal}
      />
      
      {/* Modal Selector de Productos */}
      <ProductSelector
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={handleSelectProduct}
        presentaciones={presentacionesFiltradas}
        detallesActuales={detalles}
        title="Seleccionar Producto para Venta"
      />
    </ScreenContainer>
  );
}
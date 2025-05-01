import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import {  clienteApi, almacenApi, presentacionApi, pagoApi } from '@/services/api';
import { ventaApi } from '@/services/venta';
import { Venta, ClienteSimple, AlmacenSimple, Presentacion, VentaDetalle, Pago, UserSimple, StockPorAlmacen } from '@/models';
import { useForm } from '@/hooks/useForm';
import { useAuth } from '@/context/AuthContext';

// Interfaces y Tipos
interface VentaDetalleForm extends Omit<VentaDetalle, 'id' | 'presentacion' | 'venta_id'> {
  id?: number;
  presentacion_id: number;
  cantidad: number;
  precio_unitario: string;
}

interface VentaForm {
  cliente_id: string;
  almacen_id: string;
  fecha: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg: string;
  detalles: VentaDetalleForm[];
}

// Valores iniciales del formulario
const initialFormValues: VentaForm = {
  cliente_id: '',
  almacen_id: '',
  fecha: new Date().toISOString().split('T')[0],
  tipo_pago: 'contado',
  consumo_diario_kg: '',
  detalles: [],
};

// Reglas de validación (simplificadas para el ejemplo)
const validationRules = {
  cliente_id: (value: string) => !value ? 'El cliente es requerido' : null,
  almacen_id: (value: string) => !value ? 'El almacén es requerido' : null,
  fecha: (value: string) => !value ? 'La fecha es requerida' : null,
  detalles: (value: VentaDetalleForm[]) => value.length === 0 ? 'Debe agregar al menos un producto' : null,
};

export function useVentaItem() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const defaultUserAlmacenId = user?.almacen_id?.toString(); 

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venta, setVenta] = useState<Venta | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<ClienteSimple[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);
  const [allPresentaciones, setAllPresentaciones] = useState<Presentacion[]>([]);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const form = useForm<VentaForm>(initialFormValues);
  const { formData, setValues, resetForm, handleChange, errors, setErrors } = form;

  const filterPresentacionesByAlmacen = useCallback((almacenId: string, sourcePresentaciones: Presentacion[] = allPresentaciones) => {
    if (!almacenId) {
        setPresentaciones([]);
        return;
    }
    const numAlmacenId = parseInt(almacenId, 10);
    if (isNaN(numAlmacenId)) {
         console.warn(`Almacen ID inválido para filtrar: ${almacenId}`);
         setPresentaciones([]);
         return;
    }
    const filtradas = sourcePresentaciones.map(p => {
        let stock: number | string | null = 0;
        if (isAdmin && p.stock_por_almacen) {
          const stockInfo = p.stock_por_almacen.find((s: StockPorAlmacen) => s.almacen_id === numAlmacenId);
          stock = stockInfo ? stockInfo.cantidad : 0;
        } else {
          stock = p.stock_disponible ?? 0;
        }
        return {
            ...p,
            stock_disponible: stock
        };
    });
    setPresentaciones(filtradas);
  }, [allPresentaciones, isAdmin]);

  const loadInitialData = useCallback(async () => {
    console.log("Cargando datos iniciales para formulario de venta...");
    setIsLoadingOptions(true);
    setError(null);
    try {
      const almacenIdNum = defaultUserAlmacenId ? parseInt(defaultUserAlmacenId, 10) : undefined;
      const almacenIdParam = isAdmin ? undefined : almacenIdNum; 
      
      if (!isAdmin && almacenIdParam === undefined) {
        throw new Error("Usuario no tiene almacén asignado o ID inválido.");
      }
      
      const data = await ventaApi.getFormData(almacenIdParam);
      
      setClientes(data.clientes || []);
      setAlmacenes(data.almacenes || []);
      
      const presentacionesRecibidas = data.presentaciones_con_stock_local || data.presentaciones_con_stock_global || data.presentaciones || [];
      
      console.log(`Presentaciones recibidas (${presentacionesRecibidas.length}):`, presentacionesRecibidas);
      setAllPresentaciones(presentacionesRecibidas); 
      
      const initialAlmacenId = defaultUserAlmacenId || (isAdmin ? (data.almacenes?.[0]?.id?.toString() || '') : '');
      if (!initialAlmacenId && !isAdmin) {
         throw new Error("Almacén inicial no definido para el usuario.");
      }
      console.log("Almacén inicial para el formulario:", initialAlmacenId);
      
      resetForm({
        ...initialFormValues,
        almacen_id: initialAlmacenId,
        fecha: new Date().toISOString().split('T')[0],
      });
      
      filterPresentacionesByAlmacen(initialAlmacenId, presentacionesRecibidas);
      
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
      setClientes([]); setAlmacenes([]); setAllPresentaciones([]); setPresentaciones([]);
    } finally {
      setIsLoadingOptions(false);
    }
  }, [user, isAdmin, defaultUserAlmacenId, resetForm, filterPresentacionesByAlmacen]);

  const loadVentaForEdit = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    setClientes([]);
    try {
      console.log(`Cargando datos para edición de venta ID: ${id}`);
      
      const ventaData = await ventaApi.getVenta(id);
      if (!ventaData) throw new Error('Venta no encontrada');
      setVenta(ventaData);
      console.log("Datos de la venta recibidos:", ventaData);

      console.log("Cargando lista de clientes...");
      const clientesResponse = await clienteApi.getClientes(1, 1000);
      setClientes(clientesResponse.data || []);

      setValues({
        cliente_id: ventaData.cliente_id?.toString() || '',
        almacen_id: ventaData.almacen_id?.toString() || '',
        fecha: ventaData.fecha ? ventaData.fecha.split('T')[0] : '',
        tipo_pago: ventaData.tipo_pago || 'contado',
        consumo_diario_kg: ventaData.consumo_diario_kg?.toString() || '',
        detalles: [],
      });

      if (ventaData.almacen) {
        setAlmacenes([ventaData.almacen]); 
      } else {
        setAlmacenes([]);
      }

    } catch (err) {
      console.error(`Error cargando venta ${id} para edición:`, err);
      const message = err instanceof Error ? err.message : 'Error al cargar la venta para editar';
      setError(message);
      resetForm();
      setClientes([]);
      setAlmacenes([]);
    } finally {
      setIsLoading(false);
    }
  }, [setValues, resetForm]);
  
  const getVenta = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const ventaData = await ventaApi.getVenta(id);
      if (!ventaData) throw new Error('Venta no encontrada');
      setVenta(ventaData);
      if (ventaData.pagos && ventaData.pagos.length > 0) {
        try {
           const pagosData = await pagoApi.getPagosByVenta(id);
           setPagos(pagosData || []);
        } catch(pagoError) {
            console.error(`Error cargando pagos para venta ${id}:`, pagoError);
        }
      } else {
        setPagos([]);
      }
    } catch (err) {
      console.error(`Error obteniendo venta ${id}:`, err);
      const message = err instanceof Error ? err.message : 'Error al obtener la venta';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteVenta = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await ventaApi.deleteVenta(id);
      Alert.alert('Éxito', 'Venta eliminada correctamente');
      return true;
    } catch (err) {
      console.error(`Error eliminando venta ${id}:`, err);
      const message = err instanceof Error ? err.message : 'Error al eliminar la venta';
      setError(message);
      Alert.alert('Error', message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDateSelection = useCallback((selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleChange('fecha', formattedDate);
    }
  }, [handleChange]);

  const handleSelectCliente = useCallback((cliente: ClienteSimple) => {
    if (!cliente || typeof cliente.id === 'undefined') {
      console.error("handleSelectCliente (Ventas): cliente inválido o sin ID:", cliente);
      Alert.alert("Error", "No se pudo seleccionar el cliente.");
      return;
    }
    handleChange('cliente_id', cliente.id.toString());
    setShowClienteModal(false);
  }, [handleChange]);

   const handleClienteCreated = useCallback((nuevoCliente: ClienteSimple) => {
    setClientes(prev => [nuevoCliente, ...prev]);
    handleChange('cliente_id', nuevoCliente.id.toString());
    setShowClienteModal(false);
  }, [handleChange]);

  const handleAlmacenChange = useCallback((newAlmacenId: string) => {
    if (!newAlmacenId) return;

    const proceedWithChange = () => {
      handleChange('almacen_id', newAlmacenId);
      handleChange('detalles', []);
      filterPresentacionesByAlmacen(newAlmacenId, allPresentaciones);
      setErrors((currentErrors: typeof errors) => {
         const { detalles, ...rest } = currentErrors;
         return rest;
       });
    };

    if (formData.detalles.length > 0) {
      Alert.alert(
        "Cambiar Almacén",
        "Cambiar el almacén eliminará los productos agregados. ¿Desea continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", onPress: proceedWithChange }
        ]
      );
    } else {
      proceedWithChange();
    }
  }, [handleChange, filterPresentacionesByAlmacen, allPresentaciones, formData.detalles, setErrors]);

  const applyChange = useCallback((changeFn: (prevDetalles: VentaDetalleForm[]) => VentaDetalleForm[]) => {
    const newDetalles = changeFn(formData.detalles);
    setValues({ detalles: newDetalles }); 
     if (errors.detalles) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.detalles;
            return newErrors;
        });
     }
  }, [formData.detalles, setValues, errors.detalles, setErrors]);

  const agregarProducto = useCallback((presentacionId: string, cantidad: string, precioUnitario: string) => {
    const presentacion = allPresentaciones.find(p => p.id.toString() === presentacionId);
    if (!presentacion) return;

    const nuevoDetalle: VentaDetalleForm = {
      presentacion_id: presentacion.id,
      cantidad: parseInt(cantidad, 10) || 1,
      precio_unitario: precioUnitario,
    };

    applyChange(prevDetalles => {
      const existenteIndex = prevDetalles.findIndex(d => d.presentacion_id.toString() === presentacionId);
      if (existenteIndex > -1) {
        const actualizados = [...prevDetalles];
        actualizados[existenteIndex] = {
          ...actualizados[existenteIndex],
          cantidad: (actualizados[existenteIndex].cantidad || 0) + nuevoDetalle.cantidad,
          precio_unitario: nuevoDetalle.precio_unitario
        };
        return actualizados;
      } else {
        return [...prevDetalles, nuevoDetalle];
      }
    });

    setShowProductModal(false);
  }, [allPresentaciones, applyChange]);

  const actualizarProducto = useCallback((index: number, field: 'cantidad' | 'precio_unitario', value: string) => {
    applyChange(prevDetalles => {
        const detallesActualizados = [...prevDetalles];
        if (detallesActualizados[index]) {
            if (field === 'cantidad') {
                detallesActualizados[index].cantidad = parseInt(value, 10) || 0;
            } else {
                detallesActualizados[index].precio_unitario = value;
            }
        }
        return detallesActualizados;
     });
  }, [applyChange]);

  const eliminarProducto = useCallback((index: number) => {
    applyChange(prevDetalles => prevDetalles.filter((_, i) => i !== index));
  }, [applyChange]);

  const calcularTotal = useCallback(() => {
    return formData.detalles.reduce((total, detalle) => {
      const cantidad = detalle.cantidad || 0;
      const precio = parseFloat(detalle.precio_unitario || '0');
      return total + (cantidad * precio);
    }, 0);
  }, [formData.detalles]);

  const createVenta = useCallback(async (): Promise<boolean> => {
     if (!form.validate(validationRules)) { Alert.alert('Error de Validación', 'Revise los campos'); return false; }
     setIsLoading(true); setError(null);
     try {
       const payload: CreateVentaPayload = {
         cliente_id: parseInt(formData.cliente_id, 10),
         almacen_id: parseInt(formData.almacen_id, 10),
         fecha: `${formData.fecha}T00:00:00Z`, 
         tipo_pago: formData.tipo_pago,
         consumo_diario_kg: formData.consumo_diario_kg || undefined,
         detalles: formData.detalles.map(d => ({
           presentacion_id: d.presentacion_id,
           cantidad: d.cantidad,
           precio_unitario: d.precio_unitario
         }))
       };
       await ventaApi.createVenta(payload);
       Alert.alert('Éxito', 'Venta creada'); resetForm(); router.replace('/ventas'); return true;
     } catch (err) {
        console.error('Error creando venta:', err);
        const message = err instanceof Error ? err.message : 'Error al crear'; setError(message); Alert.alert('Error', message); return false;
     } finally { setIsLoading(false); }
  }, [formData, form, resetForm]);

  const updateVenta = useCallback(async (id: number): Promise<boolean> => {
     if (!formData.cliente_id || !formData.fecha || !formData.tipo_pago) {
        Alert.alert('Error de Validación', 'Cliente, Fecha y Tipo de Pago son requeridos.'); 
        return false; 
     }

     setIsLoading(true); 
     setError(null);
     try {
        // Parsear consumo diario y manejar casos vacíos/inválidos
        let consumoKg: number | null = null;
        if (formData.consumo_diario_kg && formData.consumo_diario_kg.trim() !== '') {
            consumoKg = parseFloat(formData.consumo_diario_kg.replace(',', '.'));
            if (isNaN(consumoKg)) {
                consumoKg = null; // Si no es un número válido, tratar como null
            }
        }
        
        // Construir payload SOLO con campos editables y tipos correctos
        const payload: Partial<Venta> = {
             cliente_id: parseInt(formData.cliente_id, 10),
             fecha: `${formData.fecha}T00:00:00Z`, 
             tipo_pago: formData.tipo_pago,
             // Asignar el valor numérico parseado (o null) y convertir a string si no es null
             consumo_diario_kg: consumoKg !== null ? consumoKg.toString() : undefined,
           };
           
        // No necesitamos el filtro isNaN aquí porque ya lo manejamos al parsear

        await ventaApi.updateVenta(id, payload);
        Alert.alert('Éxito', 'Venta actualizada'); 
        router.replace(`/ventas/${id}`); 
        return true;
     } catch (err) {
        console.error(`Error actualizando venta ${id}:`, err);
        const message = err instanceof Error ? err.message : 'Error al actualizar'; 
        setError(message); 
        Alert.alert('Error', message); 
        return false;
     } finally { 
        setIsLoading(false); 
     }
  }, [formData]);

  return {
    isLoading,
    isLoadingOptions,
    error,
    venta,
    pagos,
    isAdmin,
    form,
    validationRules,
    clientes,
    almacenes,
    presentaciones,
    showDatePicker,
    setShowDatePicker,
    showClienteModal,
    setShowClienteModal,
    showProductModal,
    setShowProductModal,
    getVenta,
    loadInitialData,
    loadVentaForEdit,
    createVenta,
    updateVenta,
    deleteVenta,
    handleDateSelection,
    handleSelectCliente,
    handleClienteCreated,
    handleAlmacenChange,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    calcularTotal,
  };
}

interface CreateVentaPayload {
  cliente_id: number;
  almacen_id: number;
  fecha: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg?: string;
  detalles: {
    presentacion_id: number;
    cantidad: number;
    precio_unitario: string;
  }[];
}
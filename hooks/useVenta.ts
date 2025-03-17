// hooks/useVenta.ts - Manejo de ventas (corregido)
import { useState } from 'react';
import { ventaApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Venta } from '@/models';

interface DetalleVenta {
  presentacion_id: string;
  cantidad: string;
  precio_unitario: string;
}

interface VentaForm {
  cliente_id: string;
  almacen_id: string;
  fecha: string;
  tipo_pago: 'contado' | 'credito';
  consumo_diario_kg?: string;
}

export function useVenta() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VentaForm>({
    cliente_id: '',
    almacen_id: user?.almacen_id?.toString() || '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_pago: 'contado',
    consumo_diario_kg: ''
  });
  
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar campo del formulario
  const handleChange = (field: keyof VentaForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error si existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Agregar producto a la venta
  const agregarProducto = (
    presentacionId: string, 
    cantidad: string = '1', 
    precioUnitario: string = '0'
  ) => {
    // Verificar si ya existe
    const existe = detalles.some(d => d.presentacion_id === presentacionId);
    if (existe) {
      return false;
    }
    
    // Agregar nuevo detalle
    setDetalles(prev => [
      ...prev,
      {
        presentacion_id: presentacionId,
        cantidad,
        precio_unitario: precioUnitario
      }
    ]);
    
    return true;
  };

  // Actualizar producto existente
  const actualizarProducto = (
    index: number, 
    field: keyof DetalleVenta, 
    value: string
  ) => {
    const newDetalles = [...detalles];
    
    // Validaciones específicas según el campo
    if (field === 'cantidad') {
      const numValue = value.replace(/[^0-9]/g, '');
      newDetalles[index] = { 
        ...newDetalles[index], 
        [field]: numValue === '' ? '1' : numValue
      };
    } 
    else if (field === 'precio_unitario') {
      const precio = value.replace(/[^0-9.,]/g, '').replace(',', '.');
      if (precio === '' || /^\d+(\.\d{0,2})?$/.test(precio)) {
        newDetalles[index] = { ...newDetalles[index], [field]: precio };
      }
    } 
    else {
      newDetalles[index] = { ...newDetalles[index], [field]: value };
    }
    
    setDetalles(newDetalles);
  };

  // Eliminar producto
  const eliminarProducto = (index: number) => {
    const newDetalles = [...detalles];
    newDetalles.splice(index, 1);
    setDetalles(newDetalles);
  };

  // Calcular total
  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseInt(detalle.cantidad || '0');
      const precio = parseFloat(detalle.precio_unitario || '0');
      return total + (cantidad * precio);
    }, 0).toFixed(2);
  };

  // Validar formulario
  const validarFormulario = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'El cliente es requerido';
    }
    
    if (!formData.almacen_id) {
      newErrors.almacen_id = 'El almacén es requerido';
    }
    
    if (detalles.length === 0) {
      newErrors.detalles = 'Debe agregar al menos un producto';
    }
    
    // Validar cada detalle
    detalles.forEach((detalle, index) => {
      if (!detalle.presentacion_id) {
        newErrors[`detalle_${index}_presentacion`] = 'La presentación es requerida';
      }
      
      if (!detalle.cantidad || parseInt(detalle.cantidad) <= 0) {
        newErrors[`detalle_${index}_cantidad`] = 'La cantidad debe ser mayor a 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear venta
  const crearVenta = async () => {
    if (!validarFormulario()) {
      return null;
    }
    
    try {
      setIsSubmitting(true);
      
      // IMPORTANTE: Preparar datos con el formato correcto para la API
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        tipo_pago: formData.tipo_pago,
        detalles: detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad || '1'),
          precio_unitario: parseFloat(d.precio_unitario || '0')
        }))
      };
      
      // Solo añadir campos opcionales si tienen valor válido
      if (formData.fecha && formData.fecha !== new Date().toISOString().split('T')[0]) {
        ventaData.fecha = formData.fecha;
      }
      
      if (formData.consumo_diario_kg && parseFloat(formData.consumo_diario_kg) > 0) {
        ventaData.consumo_diario_kg = formData.consumo_diario_kg;
      }
      
      console.log('Enviando datos de venta:', ventaData);
      const response = await ventaApi.createVenta(ventaData);
      return response;
    } catch (error) {
      console.error('Error al crear venta:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar venta existente
  const actualizarVenta = async (id: number) => {
    if (!validarFormulario()) {
      return null;
    }
    
    try {
      setIsSubmitting(true);
      
      // Para actualización solo enviamos datos básicos
      const ventaData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        fecha: formData.fecha,
        tipo_pago: formData.tipo_pago,
      };
      
      const response = await ventaApi.updateVenta(id, ventaData);
      return response;
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar venta existente
  const cargarVenta = (venta: Venta) => {
    // Cargar datos del formulario
    setFormData({
      cliente_id: venta.cliente_id.toString(),
      almacen_id: venta.almacen_id.toString(),
      fecha: venta.fecha.split('T')[0],
      tipo_pago: venta.tipo_pago,
      consumo_diario_kg: venta.consumo_diario_kg || ''
    });
    
    // Cargar detalles si existen
    if (venta.detalles && venta.detalles.length > 0) {
      setDetalles(venta.detalles.map(d => ({
        presentacion_id: d.presentacion_id.toString(),
        cantidad: d.cantidad.toString(),
        precio_unitario: d.precio_unitario
      })));
    }
  };

  return {
    formData,
    detalles,
    errors,
    isSubmitting,
    handleChange,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    calcularTotal,
    validarFormulario,
    crearVenta,
    actualizarVenta,
    cargarVenta,
    setDetalles
  };
}
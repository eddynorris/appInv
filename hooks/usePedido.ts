// hooks/usePedido.ts - Manejo de creación/edición de pedidos
import { useState } from 'react';
import { pedidoApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Pedido, PedidoDetalle } from '@/models';

interface DetallePedido {
  presentacion_id: string;
  cantidad: string;
  precio_estimado: string;
}

interface PedidoForm {
  cliente_id: string;
  almacen_id: string;
  fecha_entrega: string;
  estado: 'programado' | 'confirmado' | 'entregado' | 'cancelado';
  notas: string;
}

export function usePedido() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PedidoForm>({
    cliente_id: '',
    almacen_id: user?.almacen_id?.toString() || '',
    fecha_entrega: new Date().toISOString().split('T')[0],
    estado: 'programado',
    notas: ''
  });
  
  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar campo del formulario
  const handleChange = (field: keyof PedidoForm, value: string) => {
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

  // Agregar producto al pedido
  const agregarProducto = (
    presentacionId: string, 
    cantidad: string = '1', 
    precioEstimado: string = '0'
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
        precio_estimado: precioEstimado
      }
    ]);
    
    return true;
  };

  // Actualizar producto existente
  const actualizarProducto = (
    index: number, 
    field: keyof DetallePedido, 
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
    else if (field === 'precio_estimado') {
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
      const precio = parseFloat(detalle.precio_estimado || '0');
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
    
    if (!formData.fecha_entrega) {
      newErrors.fecha_entrega = 'La fecha de entrega es requerida';
    }
    
    if (detalles.length === 0) {
      newErrors.detalles = 'Debe agregar al menos un producto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear pedido
  const crearPedido = async () => {
    if (!validarFormulario()) {
      return null;
    }
    
    try {
      setIsSubmitting(true);
      
      const pedidoData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        vendedor_id: parseInt(user?.id?.toString() || '0'),
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`,
        estado: formData.estado,
        notas: formData.notas || 'Ninguna',
        detalles: detalles.map(d => ({
          presentacion_id: parseInt(d.presentacion_id),
          cantidad: parseInt(d.cantidad || '1'),
          precio_estimado: d.precio_estimado
        }))
      };
      
      const response = await pedidoApi.createPedido(pedidoData);
      return response;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar pedido existente
  const actualizarPedido = async (id: number) => {
    if (!validarFormulario()) {
      return null;
    }
    
    try {
      setIsSubmitting(true);
      
      const pedidoData = {
        cliente_id: parseInt(formData.cliente_id),
        almacen_id: parseInt(formData.almacen_id),
        fecha_entrega: `${formData.fecha_entrega}T00:00:00Z`,
        estado: formData.estado,
        notas: formData.notas
      };
      
      const response = await pedidoApi.updatePedido(id, pedidoData);
      return response;
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cargar pedido existente
  const cargarPedido = (pedido: Pedido) => {
    // Cargar datos del formulario
    setFormData({
      cliente_id: pedido.cliente_id.toString(),
      almacen_id: pedido.almacen_id.toString(),
      fecha_entrega: pedido.fecha_entrega.split('T')[0],
      estado: pedido.estado as 'programado' | 'confirmado' | 'entregado' | 'cancelado',
      notas: pedido.notas || ''
    });
    
    // Cargar detalles si existen
    if (pedido.detalles && pedido.detalles.length > 0) {
      setDetalles(pedido.detalles.map(d => ({
        presentacion_id: d.presentacion_id.toString(),
        cantidad: d.cantidad.toString(),
        precio_estimado: d.precio_estimado
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
    crearPedido,
    actualizarPedido,
    cargarPedido,
    setDetalles
  };
}
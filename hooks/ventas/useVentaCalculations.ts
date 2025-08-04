import { useCallback } from 'react';

// Interfaces
interface VentaDetalleForm {
  id?: number;
  presentacion_id: number;
  cantidad: number;
  precio_unitario: string;
}

export function useVentaCalculations() {
  // Calculate total amount for all products
  const calcularTotal = useCallback((detalles: VentaDetalleForm[]) => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseFloat(detalle.cantidad.toString()) || 0;
      const precio = parseFloat(detalle.precio_unitario) || 0;
      return total + (cantidad * precio);
    }, 0);
  }, []);

  // Calculate total quantity
  const calcularCantidadTotal = useCallback((detalles: VentaDetalleForm[]) => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseFloat(detalle.cantidad.toString()) || 0;
      return total + cantidad;
    }, 0);
  }, []);

  // Calculate subtotal for a single detail
  const calcularSubtotal = useCallback((cantidad: number | string, precioUnitario: string) => {
    const cantidadNum = parseFloat(cantidad.toString()) || 0;
    const precioNum = parseFloat(precioUnitario) || 0;
    return cantidadNum * precioNum;
  }, []);

  // Validate if product can be added (stock validation)
  const validarStock = useCallback((
    cantidad: number | string, 
    stockDisponible: number | string | null
  ) => {
    const cantidadNum = parseFloat(cantidad.toString()) || 0;
    const stockNum = parseFloat(stockDisponible?.toString() || '0') || 0;
    
    return cantidadNum <= stockNum;
  }, []);

  // Format currency
  const formatearPrecio = useCallback((precio: number | string) => {
    const precioNum = parseFloat(precio.toString()) || 0;
    return precioNum.toFixed(2);
  }, []);

  // Calculate profit margin (if needed)
  const calcularMargen = useCallback((precioVenta: number | string, precioCompra: number | string) => {
    const ventaNum = parseFloat(precioVenta.toString()) || 0;
    const compraNum = parseFloat(precioCompra.toString()) || 0;
    
    if (compraNum === 0) return 0;
    
    return ((ventaNum - compraNum) / compraNum) * 100;
  }, []);

  return {
    calcularTotal,
    calcularCantidadTotal,
    calcularSubtotal,
    validarStock,
    formatearPrecio,
    calcularMargen,
  };
}
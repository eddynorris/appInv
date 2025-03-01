// Define los modelos relacionados con ventas basados en el esquema de la API
import { ClienteSimple } from './cliente';
import { AlmacenSimple } from './almacen';
import { ProductoSimple } from './producto';

// Actualización a la interfaz Cliente para incluir la versión simplificada
export interface ClienteSimple {
  id: number;
  nombre: string;
}

// Interfaz para VentaDetalle
export interface VentaDetalle {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  fecha_reabastecimiento?: string;
  producto: ProductoSimple;
}

// Interfaz para VentaCredito
export interface VentaCredito {
  venta_id: number;
  fecha_vencimiento: string;
  monto_pagado: string; // Decimal como string
  estado_pago: string;
}

// Interfaz principal para Venta
export interface Venta {
  id: number;
  cliente_id: number;
  almacen_id: number;
  fecha: string;
  total: string; // Decimal como string
  tipo_pago: 'contado' | 'credito';
  estado_pago: 'pendiente' | 'parcial' | 'pagado';
  
  // Relaciones anidadas
  cliente: ClienteSimple;
  almacen: AlmacenSimple;
  detalles: VentaDetalle[];
  credito?: VentaCredito;
}

// Versión simplificada para relaciones anidadas
export interface VentaSimple {
  id: number;
  total: string;
}
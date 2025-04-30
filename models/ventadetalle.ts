// models/ventaDetalle.ts
import { PresentacionSimple } from './presentacion';

// Interfaz base para VentaDetalle (como viene de la API)
export interface VentaDetalle {
  id: number;
  venta_id: number;
  presentacion_id: number;
  cantidad: number;
  precio_unitario: string;
  presentacion?: PresentacionSimple; // Opcional, puede incluirse en algunas llamadas
}

// Interfaz específica para el formulario
export interface VentaDetalleForm extends Omit<VentaDetalle, 'id' | 'venta_id' | 'presentacion'> {
  id?: number; // ID opcional para identificar detalles existentes al editar
  presentacion_id: number;
  cantidad: number;
  precio_unitario: string;
}
// Define los modelos relacionados con ventas basados en el esquema de la API
import { ClienteSimple } from './cliente';
import { AlmacenSimple } from './almacen';
import { VentaDetalle } from './ventadetalle';
import { Pago } from './pago';
// models/venta.ts
export interface Venta {
  id: number;
  cliente_id: number;
  almacen_id: number;
  fecha: string;
  total: string;
  tipo_pago: 'contado' | 'credito';
  estado_pago: 'pendiente' | 'parcial' | 'pagado';
  consumo_diario_kg?: string;
  cliente?: ClienteSimple;
  almacen?: AlmacenSimple;
  detalles?: VentaDetalle[];
  pagos?: Pago[];
  saldo_pendiente?: string;
}

export interface VentaSimple {
  id: number;
  total: string;
}
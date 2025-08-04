// models/venta.ts - Actualización para incluir vendedor_id y vendedor
import { ClienteSimple } from './cliente';
import { AlmacenSimple } from './almacen';
import { VentaDetalle } from './ventadetalle';
import { Pago } from './pago';
import { UserSimple } from './user';

// models/venta.ts
export interface Venta {
  id: number;
  cliente_id: number;
  almacen_id: number;
  vendedor_id?: number;  // Campo nuevo
  fecha: string;
  total: string;
  tipo_pago: 'contado' | 'credito';
  estado_pago: 'pendiente' | 'parcial' | 'pagado';
  consumo_diario_kg?: string;
  cliente?: ClienteSimple;
  almacen?: AlmacenSimple;
  vendedor?: UserSimple;  // Relación con el usuario vendedor
  detalles?: VentaDetalle[];
  pagos?: Pago[];
  saldo_pendiente?: string;
}

export interface VentaSimple {
  id: number;
  total: string;
  cliente?: ClienteSimple;
}
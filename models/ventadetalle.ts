// models/ventaDetalle.ts
import { Presentacion } from './presentacion';

export interface VentaDetalle {
    id: number;
    venta_id: number;
    presentacion_id: number;
    cantidad: number;
    precio_unitario: string;
    presentacion?: Presentacion;
    total_linea?: string;
  }
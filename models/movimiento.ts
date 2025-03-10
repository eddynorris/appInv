import { Presentacion } from './presentacion';
import { Lote } from './lote';

// models/movimiento.ts
export interface Movimiento {
  id: number;
  tipo: 'entrada' | 'salida';
  presentacion_id: number;
  lote_id?: number;
  usuario_id?: number;
  cantidad: string;
  fecha: string;
  motivo?: string;
  presentacion?: Presentacion;
  lote?: Lote;
}
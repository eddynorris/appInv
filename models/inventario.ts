// models/inventario.ts
import { AlmacenSimple } from './almacen';
import { Presentacion } from './presentacion';
import { Lote } from './lote';

export interface Inventario {
    id: number;
    presentacion_id: number;
    almacen_id: number;
    lote_id?: number;
    cantidad: number;
    stock_minimo: number;
    ultima_actualizacion: string;
    presentacion?: Presentacion;
    almacen?: AlmacenSimple;
    lote?: Lote;
  }
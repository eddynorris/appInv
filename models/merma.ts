// models/merma.ts
import { Lote } from './lote';

export interface Merma {
    id: number;
    lote_id: number;
    cantidad_kg: string;
    convertido_a_briquetas: boolean;
    fecha_registro: string;
    usuario_id?: number;
    lote?: Lote;
  }
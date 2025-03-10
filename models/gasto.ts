// models/gasto.ts
import { AlmacenSimple } from './almacen';

export interface Gasto {
  id: number;
  descripcion: string;
  monto: string;
  fecha: string;
  categoria: 'logistica' | 'personal' | 'otros';
  almacen_id?: number;
  usuario_id?: number;
  almacen?: AlmacenSimple;
}
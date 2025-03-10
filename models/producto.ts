// models/producto.ts
import { Presentacion } from './presentacion';

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_compra: string;
  activo: boolean;
  created_at: string;
  presentaciones?: Presentacion[];
}

export interface ProductoSimple {
  id: number;
  nombre: string;
}
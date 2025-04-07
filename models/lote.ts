// models/lote.ts
import { ProductoSimple } from './producto';
import { ProveedorSimple } from './proveedor';

export interface Lote {
    id: number;
    producto_id: number;
    proveedor_id?: number;
    descripcion?: string;
    peso_humedo_kg: string;
    peso_seco_kg?: string;
    fecha_ingreso: string;
    cantidad_disponible_kg?: string;
    producto?: ProductoSimple;
    proveedor?: ProveedorSimple;
  }
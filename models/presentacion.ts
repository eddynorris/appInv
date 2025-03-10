// models/presentacion.ts
import { ProductoSimple } from './producto';

export interface Presentacion {
    id: number;
    producto_id: number;
    nombre: string;
    capacidad_kg: string;
    tipo: 'bruto' | 'procesado' | 'merma' | 'briqueta' | 'detalle';
    precio_venta: string;
    activo: boolean;
    producto?: ProductoSimple;
  }

  export interface PresentacionSimple {
    id: number;
    nombre: string;
    precio_venta: string;
  }
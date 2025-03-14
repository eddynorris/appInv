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
    url_foto?: string; 
    producto?: ProductoSimple;
  }

  export interface PresentacionSimple {
    id: number;
    nombre: string;
    precio_venta: string;
    url_foto?: string; 
  }
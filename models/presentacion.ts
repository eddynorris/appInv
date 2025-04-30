// models/presentacion.ts
import { ProductoSimple } from './producto';

// Nueva interfaz para el detalle de stock por almacén
export interface StockPorAlmacen {
  almacen_id: number;
  nombre: string; // Nombre del almacén
  cantidad: number;
}

export interface Presentacion {
    id: number;
    producto_id: number;
    nombre: string;
    tipo?: string;
    capacidad_kg: string;
    precio_venta?: string | null;
    precio_compra?: string | null;
    url_foto?: string | null;
    activo: boolean;
    producto?: ProductoSimple;
    // Stock disponible general o filtrado por API para no-admin
    stock_disponible?: number | string | null;
    // Detalle de stock por almacén (opcional, usado por admin)
    stock_por_almacen?: StockPorAlmacen[]; 
}

export interface PresentacionSimple {
    id: number;
    nombre: string;
    capacidad_kg: string;
    url_foto?: string | null;
}
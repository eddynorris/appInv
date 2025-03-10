// models/almacen.ts
export interface Almacen {
  id: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  inventario?: any[];
  ventas?: any[];
}

export interface AlmacenSimple {
  id: number;
  nombre: string;
}
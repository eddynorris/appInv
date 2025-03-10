// models/proveedor.ts
export interface Proveedor {
  id: number;
  nombre: string;
  telefono?: string;
  direccion?: string;
  created_at: string;
  lotes?: any[];
}

export interface ProveedorSimple {
  id: number;
  nombre: string;
}
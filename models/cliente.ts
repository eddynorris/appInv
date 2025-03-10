// models/cliente.ts
export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  created_at: string;
  frecuencia_compra_dias?: number;
  ultima_fecha_compra?: string;
  saldo_pendiente: string;
  ventas?: any[];
}

export interface ClienteSimple {
  id: number;
  nombre: string;
}
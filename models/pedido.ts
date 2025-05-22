// models/pedido.ts
import { ClienteSimple } from './cliente';
import { AlmacenSimple } from './almacen';
import { UserSimple } from './user';
import { PedidoDetalle } from './pedidoDetalle';

// Tipos posibles para el estado del pedido (Movido aquí)
export const ESTADOS_PEDIDO: Array<'programado' | 'confirmado'> = [
  'programado',
  'confirmado'
  //'entregado',
  //'cancelado'
];

export interface Pedido {
  id: number;
  cliente_id: number;
  almacen_id: number;
  vendedor_id?: number;
  fecha_creacion: string;
  fecha_entrega: string;
  estado: 'programado' | 'confirmado' | 'entregado' | 'cancelado';
  notas?: string;
  cliente?: ClienteSimple;
  almacen?: AlmacenSimple;
  vendedor?: UserSimple;
  detalles?: PedidoDetalle[];
  total_estimado?: string;
}

export interface PedidoSimple {
  id: number;
  fecha_entrega: string;
  estado: string;
}
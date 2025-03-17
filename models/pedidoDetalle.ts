// models/pedidoDetalle.ts
import { Presentacion } from './presentacion';

export interface PedidoDetalle {
  id: number;
  pedido_id: number;
  presentacion_id: number;
  cantidad: number;
  precio_estimado: string;
  presentacion?: Presentacion;
}
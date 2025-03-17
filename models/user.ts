// models/user.ts
import { AlmacenSimple } from './almacen';

export interface User {
  id: number;
  username: string;
  rol: string;
  almacen_id?: number;
  almacen?: AlmacenSimple;
}

export interface UserSimple {
  id: number;
  username: string;
}
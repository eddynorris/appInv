// Define el modelo Proveedor basado en el esquema de la API
export interface Proveedor {
    id: number;
    nombre: string;
    telefono?: string;
    direccion?: string;
    created_at: string;
  }
  
  // Versión simplificada para relaciones anidadas
  export interface ProveedorSimple {
    id: number;
    nombre: string;
  }
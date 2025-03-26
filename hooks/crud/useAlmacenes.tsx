// hooks/crud/useAlmacenes.ts
import { useMemo } from 'react';
import { useEntityCRUD } from './useEntityCRUD';
import { almacenApi } from '@/services/api';
import { ThemedText } from '@/components/ThemedText';

export function useAlmacenes() {
  const crudHook = useEntityCRUD({
    apiService: {
      getEntities: almacenApi.getAlmacenes,
      getEntity: almacenApi.getAlmacen,
      createEntity: almacenApi.createAlmacen,
      updateEntity: almacenApi.updateAlmacen,
      deleteEntity: almacenApi.deleteAlmacen
    },
    entityName: 'almacén'
  });
  
  // Definir columnas para la tabla (memoizadas)
  const columns = useMemo(() => [
    {
      id: 'id',
      label: 'ID',
      width: 0.5,
    },
    {
      id: 'nombre',
      label: 'Nombre',
      width: 2,
    },
    {
      id: 'ciudad',
      label: 'Ciudad',
      width: 1,
      render: (item) => <ThemedText>{item.ciudad || '-'}</ThemedText>,
    },
    {
      id: 'direccion',
      label: 'Dirección',
      width: 1.5,
      render: (item) => <ThemedText>{item.direccion || '-'}</ThemedText>,
    },
  ], []);
  
  return {
    ...crudHook,
    columns
  };
}
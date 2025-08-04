// hooks/crud/useClienteItem.ts - Migrated to use useSimpleCRUD
import { clienteService } from '@/services';
import { Cliente } from '@/models';
import { useSimpleCRUD } from '@/hooks/core/useSimpleCRUD';

export function useClienteItem() {
  const simpleCrud = useSimpleCRUD<Cliente>({
    apiService: {
      get: (id: number) => clienteService.getCliente(id),
      create: (data: Partial<Cliente>) => clienteService.createCliente(data),
      update: (id: number, data: Partial<Cliente>) => clienteService.updateCliente(id, data),
      delete: (id: number) => clienteService.deleteCliente(id),
    },
    entityName: 'Cliente',
    routePrefix: '/clientes',
  });

  // Return with legacy API compatibility
  return {
    ...simpleCrud,
    // Legacy API methods
    getCliente: simpleCrud.loadItem,
    createCliente: simpleCrud.createItem,
    updateCliente: simpleCrud.updateItem,
    deleteCliente: simpleCrud.deleteItem,
    cliente: simpleCrud.item,
  };
}
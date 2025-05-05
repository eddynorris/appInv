import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { usuarioApi, almacenApi } from '@/services/api';
import { User, UsuarioPayload, AlmacenSimple } from '@/models';
import { useForm } from '../useForm';
import { useAuth } from '@/context/AuthContext';

// Interfaz interna para el estado del formulario que incluye ID opcional
interface UsuarioFormState extends UsuarioPayload {
    id?: number; // ID opcional para diferenciar create/edit
}

// Estado inicial del formulario usando la interfaz interna
const initialFormValues: UsuarioFormState = {
  username: '',
  password: '',
  rol: 'usuario',
  almacen_id: undefined,
  id: undefined, // Inicializar id como undefined
};

export function useUsuarioItem() {
  const { user: currentUser } = useAuth(); // Usuario actual (para permisos)
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);

  // Solo admins pueden usar este hook
  if (currentUser?.rol !== 'admin') {
    return { isLoading: false, error: "No autorizado", form: null, almacenes: [], loadInitialData: () => {}, loadUsuario: async () => null, createUsuario: async () => false, updateUsuario: async () => false };
  }

  // Hook para el formulario usando la interfaz interna
  const form = useForm<UsuarioFormState>(initialFormValues);
  const { formData, setValues, resetForm, validate, errors } = form;

  // Roles disponibles (podrían venir de la API si fueran dinámicos)
  const rolesDisponibles = [
    { label: 'Usuario', value: 'usuario' },
    { label: 'Admin', value: 'admin' },
    // Añadir otros roles si existen
  ];

  // Reglas de validación (ahora puede acceder a formData.id)
  const validationRules = {
    username: (value: string) => !value.trim() ? 'El nombre de usuario es requerido' : null,
    password: (value?: string) => !formData.id && !value?.trim() ? 'La contraseña es requerida' : null, // Correcto
    rol: (value: string) => !value ? 'El rol es requerido' : null,
    almacen_id: (value?: number | null) => formData.rol === 'usuario' && !value ? 'El almacén es requerido para rol usuario' : null,
  };

  // Cargar datos iniciales (almacenes para el selector)
  const loadInitialData = useCallback(async () => {
    if (almacenes.length > 0) return; // Evitar recargar

    setIsFetchingInitial(true);
    try {
      const almacenesRes = await almacenApi.getAlmacenes(1, 100);
      setAlmacenes(almacenesRes.data || []);
    } catch (err) {
      console.error("Error cargando almacenes:", err);
      setError('Error al cargar opciones de almacén');
    } finally {
      setIsFetchingInitial(false);
    }
  }, [almacenes.length]);

  // Cargar datos de un usuario existente para editar
  const loadUsuario = useCallback(async (id: number): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    try {
      await loadInitialData();
      const usuario = await usuarioApi.getUsuario(id);
      // Usar setValues para actualizar el estado del formulario
      setValues({
        id: usuario.id, // Establecer el ID aquí
        username: usuario.username,
        rol: usuario.rol || 'usuario',
        almacen_id: usuario.almacen_id,
        password: '', // Contraseña vacía en edición
      });
      return usuario;
    } catch (err) {
      console.error(`Error cargando usuario ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuario');
      resetForm();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setValues, resetForm, loadInitialData]);

  // Crear un nuevo usuario
  const createUsuario = useCallback(async (): Promise<boolean> => {
    if (!validate(validationRules)) return false;
    setIsLoading(true);
    setError(null);
    try {
      // Excluir el 'id' temporal del payload final
      const { id, ...payload } = formData;
      if (payload.rol !== 'usuario') {
          payload.almacen_id = null;
      }
      await usuarioApi.createUsuario(payload);
      resetForm();
      return true;
    } catch (err) {
      console.error('Error creando usuario:', err);
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validate, validationRules, formData, resetForm]);

  // Actualizar un usuario existente
  const updateUsuario = useCallback(async (id: number): Promise<boolean> => {
    // Revalidar sin la contraseña
    const { password, ...editValidationRules } = validationRules;
    if (!validate(editValidationRules)) return false;
    setIsLoading(true);
    setError(null);
    try {
      // Excluir la contraseña y el id temporal del payload final
      const { password: pwd, id: userId, ...payload } = formData;
      if (payload.rol !== 'usuario') {
          payload.almacen_id = null;
      }
      await usuarioApi.updateUsuario(id, payload);
      return true;
    } catch (err) {
      console.error(`Error actualizando usuario ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validate, validationRules, formData]);

  return {
    isLoading,
    isFetchingInitial,
    error,
    form, // incluye formData, handleChange, errors, etc.
    almacenes, // Lista de almacenes para el selector
    rolesDisponibles, // Lista de roles
    loadInitialData,
    loadUsuario,
    createUsuario,
    updateUsuario,
  };
} 
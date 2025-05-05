import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { depositoApi, almacenApi } from '@/services/api';
import { DepositoBancario, DepositoPayload, AlmacenSimple } from '@/models';
import { useForm } from '../useForm';
import { useImageUploader, FileInfo } from '../useImageUploader';
import { useAuth } from '@/context/AuthContext';

// Estado inicial del formulario
const initialFormValues: DepositoPayload = {
  fecha_deposito: new Date().toISOString().split('T')[0],
  monto_depositado: '',
  almacen_id: undefined,
  usuario_id: undefined,
  referencia_bancaria: '',
  notas: '',
};

export function useDepositoItem() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [almacenes, setAlmacenes] = useState<AlmacenSimple[]>([]);
  // Estado local para el comprobante existente
  const [existingComprobanteUrl, setExistingComprobanteUrl] = useState<string | null>(null);

  // Hook para el formulario
  const form = useForm<DepositoPayload>(initialFormValues);
  const { formData, setValues, resetForm, validate, errors } = form;

  // Hook para el nuevo comprobante
  const uploader = useImageUploader({ allowedTypes: ['image', 'document'] });
  const { file: comprobante, clearFile } = uploader; // Solo necesitamos el archivo nuevo y limpiar

  // Reglas de validación
  const validationRules = {
    fecha_deposito: (value: string) => !value ? 'La fecha es requerida' : null,
    monto_depositado: (value: string) => {
      if (!value) return 'El monto es requerido';
      if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) return 'Monto inválido';
      return null;
    },
    almacen_id: (value?: number | null) => user?.rol === 'admin' && !value ? 'El almacén es requerido' : null,
  };

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    if (user?.rol !== 'admin' || almacenes.length > 0) {
      setValues({ almacen_id: user?.almacen_id, usuario_id: user?.id });
      return;
    }
    setIsFetchingInitial(true);
    try {
      const almacenesRes = await almacenApi.getAlmacenes(1, 100);
      setAlmacenes(almacenesRes.data || []);
      const defaultAlmacenId = user?.almacen_id || almacenesRes.data?.[0]?.id;
      setValues({ almacen_id: defaultAlmacenId, usuario_id: user?.id });
    } catch (err) {
      console.error("Error cargando almacenes:", err);
      setError('Error al cargar opciones');
      setValues({ usuario_id: user?.id });
    } finally {
      setIsFetchingInitial(false);
    }
  }, [user, almacenes.length, setValues]);

  // Cargar depósito para editar
  const loadDeposito = useCallback(async (id: number): Promise<DepositoBancario | null> => {
    setIsLoading(true);
    setError(null);
    setExistingComprobanteUrl(null); // Limpiar comprobante existente anterior
    try {
      await loadInitialData();
      const deposito = await depositoApi.getDeposito(id);
      setValues({
        fecha_deposito: deposito.fecha_deposito.split('T')[0],
        monto_depositado: deposito.monto_depositado,
        almacen_id: deposito.almacen_id,
        usuario_id: deposito.usuario_id,
        referencia_bancaria: deposito.referencia_bancaria || '',
        notas: deposito.notas || '',
      });
      if (deposito.url_comprobante_deposito) {
        setExistingComprobanteUrl(deposito.url_comprobante_deposito);
      }
      return deposito;
    } catch (err) {
      console.error(`Error cargando depósito ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Error al cargar depósito');
      resetForm();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setValues, resetForm, loadInitialData, setExistingComprobanteUrl]);

  // Crear depósito
  const createDeposito = useCallback(async (): Promise<boolean> => {
    if (!validate(validationRules)) return false;
    setIsLoading(true);
    setError(null);
    const payload = { ...formData, usuario_id: formData.usuario_id || user?.id };
    if (!payload.usuario_id) {
        setError("No se pudo determinar el usuario.");
        setIsLoading(false);
        return false;
    }
    try {
      await depositoApi.createDeposito(payload, comprobante?.uri);
      resetForm();
      clearFile(); // Limpiar archivo nuevo del uploader
      return true;
    } catch (err) {
      console.error('Error creando depósito:', err);
      setError(err instanceof Error ? err.message : 'Error al crear depósito');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validate, validationRules, formData, user, comprobante, resetForm, clearFile]);

  // Actualizar depósito
  const updateDeposito = useCallback(async (id: number): Promise<boolean> => {
    if (!validate(validationRules)) return false;
    setIsLoading(true);
    setError(null);
    try {
      const { usuario_id, ...payload } = formData;
      // Pasar comprobante?.uri para que la API decida si usarlo
      await depositoApi.updateDeposito(id, payload, comprobante?.uri);
      clearFile();
      setExistingComprobanteUrl(null); // Asumir que si se subió uno nuevo, el viejo se reemplaza
      return true;
    } catch (err) {
      console.error(`Error actualizando depósito ${id}:`, err);
      setError(err instanceof Error ? err.message : 'Error al actualizar depósito');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [validate, validationRules, formData, comprobante, clearFile, setExistingComprobanteUrl]);

   // Eliminar comprobante existente
   const removeExistingComprobante = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      // Llamar a la API para establecer url_comprobante_deposito a null
      // Crear un payload parcial que solo incluya el campo a nulificar
      const payload: Partial<DepositoPayload & { url_comprobante_deposito?: null }> = {
           url_comprobante_deposito: null
      };
      // Pasar el payload correcto a updateDeposito
      // El tercer argumento (comprobanteUri) es null o undefined aquí porque no estamos subiendo uno nuevo.
      await depositoApi.updateDeposito(id, payload);
      setExistingComprobanteUrl(null); // Limpiar estado local al confirmar éxito
    } catch (err) {
        console.error("Error eliminando comprobante existente:", err);
        Alert.alert("Error", "No se pudo eliminar el comprobante existente.");
    } finally {
        setIsLoading(false);
    }
   }, [setExistingComprobanteUrl]);

  return {
    isLoading,
    isFetchingInitial,
    error,
    form,
    uploader, // Contiene file, pickImage, takePhoto, pickDocument, clearFile
    existingComprobanteUrl, // URL del comprobante existente
    almacenes,
    loadInitialData,
    loadDeposito,
    createDeposito,
    updateDeposito,
    removeExistingComprobante
  };
} 
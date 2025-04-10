// app/almacenes/edit/[id].tsx
import React, { useEffect, useState, useCallback } from 'react'; // <-- Added useCallback
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { FormField } from '@/components/form/FormField';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { ThemedText } from '@/components/ThemedText';
// import { useAlmacenes } from '@/hooks/crud/useAlmacenes'; // <-- Quita esto
import { useAlmacenItem } from '@/hooks/crud/useAlmacenItem'; // <-- Añade esto
import { useForm } from '@/hooks/useForm';
import { Almacen } from '@/models'; // <-- Asegúrate que Almacen esté importado

export default function EditAlmacenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFetchingData, setIsFetchingData] = useState(true); // Renombrado para claridad

  // Usa el nuevo hook específico para el ítem
  const {
    getAlmacen,
    updateAlmacen,
    isLoading: hookIsLoading,
    error: hookError,
    setError: setHookError // Opcional: para limpiar errores del hook si es necesario
  } = useAlmacenItem();

  // Custom hook for form state
  const {
    formData,
    errors,
    isSubmitting, // Este estado es del hook useForm
    handleChange,
    handleSubmit,
    setFormData
  } = useForm({
    nombre: '',
    direccion: '',
    ciudad: '',
  });

  // Función para cargar datos del almacén
  const fetchAlmacenData = useCallback(async () => {
      if (!id) return;

      setIsFetchingData(true);

      const data = await getAlmacen(parseInt(id));

      if (data) {
        setFormData({
          nombre: data.nombre || '',
          direccion: data.direccion || '',
          ciudad: data.ciudad || '',
        });
      }
      setIsFetchingData(false);
  }, [id, getAlmacen, setFormData]); // Dependencias de la función de carga

  // Use useEffect para cargar los datos una sola vez
  useEffect(() => {
    fetchAlmacenData();
  }, [fetchAlmacenData]); // Llama a la función de carga

  // Validation rules
  const validationRules = {
    nombre: (value: string) => !value.trim() ? 'El nombre es requerido' : null,
  };

  // Handle form submission
  const submitForm = async (data: typeof formData): Promise<boolean> => { // Especifica tipo de retorno para handleSubmit
    if (!id) return false;

    // setHookError(null); // updateAlmacen ya limpia el error al iniciar

    const response = await updateAlmacen(parseInt(id), data); // Llama a updateAlmacen del hook

    if (response) {
      Alert.alert(
        'Almacén Actualizado',
        'El almacén ha sido actualizado exitosamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return true; // Indica éxito a useForm
    } else {
      // El error se establece dentro de updateAlmacen y estará disponible en hookError
      Alert.alert('Error', hookError || 'No se pudo actualizar el almacén');
      return false; // Indica fallo a useForm
    }
    // No necesitamos try/catch aquí si updateAlmacen ya lo maneja y retorna null/data
  };

  // Combinar el estado de carga: Carga inicial O envío del formulario O operación del hook
  // Nota: hookIsLoading será true durante getAlmacen y updateAlmacen.
  const isLoading = isFetchingData || isSubmitting;

  return (
    <ScreenContainer
      title="Editar Almacén"
      // Muestra carga solo durante la carga inicial de datos
      isLoading={isFetchingData}
      // Muestra el error del hook si existe
      error={hookError}
      loadingMessage="Cargando datos del almacén..."
      // Opcional: función para reintentar en caso de error de carga inicial
      // onRetry={fetchAlmacenData}
    >
       {/* Solo muestra el formulario si no hay error y la carga inicial terminó */}
       {!isFetchingData && !hookError && (
          <>
            <ThemedText type="title" style={{ marginBottom: 20 }}>Editar Almacén</ThemedText>

            <FormField
              label="Nombre"
              value={formData.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              placeholder="Ingresa el nombre del almacén"
              error={errors.nombre} // Error de validación del formulario
              required
              disabled={isSubmitting} // Deshabilitar mientras se envía
            />

            <FormField
              label="Ciudad"
              value={formData.ciudad}
              onChangeText={(value) => handleChange('ciudad', value)}
              placeholder="Ingresa la ciudad"
              error={errors.ciudad} // Error de validación del formulario
              disabled={isSubmitting} // Deshabilitar mientras se envía
            />

            <FormField
              label="Dirección"
              value={formData.direccion}
              onChangeText={(value) => handleChange('direccion', value)}
              placeholder="Ingresa la dirección"
              multiline
              error={errors.direccion} // Error de validación del formulario
              disabled={isSubmitting} // Deshabilitar mientras se envía
            />

            <ActionButtons
              onSave={() => handleSubmit(submitForm, validationRules)}
              onCancel={() => router.back()}
              // isSubmitting refleja el estado de envío del *formulario* (useForm)
              // Podríamos usar hookIsLoading para mostrar un spinner diferente durante la llamada API
              isSubmitting={isSubmitting}
              saveText="Guardar Cambios"
            />
          </>
       )}
    </ScreenContainer>
  );
}
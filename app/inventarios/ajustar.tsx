// app/inventarios/ajustar.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Button } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { IconSymbol } from '@/components/ui/IconSymbol';
import LotePickerDialog from '@/components/data/LotePickerDialog';
import { useInventarios } from '@/hooks/crud/useInventarios';
 import { Colors } from '@/styles/Theme';
import { ActionButtons } from '@/components/buttons/ActionButtons';
import { FormStyles, Shadows } from '@/styles/Theme';
import { Lote } from '@/models';

export default function AjusteInventarioScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const idNumerico = id ? parseInt(id) : null;

    const [showLotePicker, setShowLotePicker] = useState(false);

    const {
        inventarioActual,
        isLoadingItem,
        itemError,
        isAdjusting,
        ajusteForm,
        lotesDisponibles,
        isLoadingLotes,
        adjustStock,
    } = useInventarios(idNumerico);

    const { formData, handleChange, errors, setErrors } = ajusteForm;

    const esEntrada = formData.tipo_ajuste === 'entrada';

    useEffect(() => {
        if (!esEntrada) {
            handleChange('lote_origen_id', '');
        }
    }, [esEntrada, handleChange]);

    const toggleTipoAjuste = () => {
        const nuevoTipo = esEntrada ? 'salida' : 'entrada';
        handleChange('tipo_ajuste', nuevoTipo);
    };

    const handleRegistrarAjuste = async () => {
        await adjustStock();
    };

    const incrementCantidad = () => {
        const current = parseInt(formData.cantidad || '0', 10);
        handleChange('cantidad', (current + 1).toString());
    };
    const decrementCantidad = () => {
        const current = parseInt(formData.cantidad || '0', 10);
        if (current > 1) handleChange('cantidad', (current - 1).toString());
        else handleChange('cantidad', '1');
    };

    const selectedLoteInfo = useMemo(() => {
        if (!formData.lote_origen_id) return null;
        return lotesDisponibles.find(l => l.id.toString() === formData.lote_origen_id);
    }, [formData.lote_origen_id, lotesDisponibles]);

    const tituloPantalla = esEntrada ? 'Aumentar Stock (Entrada)' : 'Disminuir Stock (Salida)';
    const headerColor = esEntrada ? Colors.success : Colors.danger;
    const inventario = inventarioActual;

    return (
        <ScreenContainer
            title={tituloPantalla}
            isLoading={isLoadingItem && !inventario}
            error={itemError && !inventario ? itemError : null}
        >
            <Stack.Screen options={{ title: tituloPantalla, headerStyle: { backgroundColor: headerColor }, headerTintColor: '#fff', headerTitleStyle: { color: '#fff' }}} />

            {inventario && (
                <View style={styles.container}>
                     <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* Info Producto */}
                        <ThemedView style={styles.productCard}>
                             <ThemedText style={styles.productName}>{inventario.presentacion?.nombre || 'Producto'}</ThemedText>
                             <ThemedText style={styles.productDescription}>{inventario.presentacion?.producto?.nombre || 'Sin desc.'}</ThemedText>
                             <ThemedText style={styles.almacenText}>Almacén: {inventario.almacen?.nombre || 'N/A'}</ThemedText>
                            <View style={styles.stockInfoContainer}>
                                 <View style={styles.stockInfoItem}>
                                     <ThemedText style={styles.stockInfoLabel}>Stock actual:</ThemedText>
                                     <ThemedText style={styles.stockInfoValue}>{inventario.cantidad}</ThemedText>
                                 </View>
                                 <View style={styles.stockInfoItem}>
                                     <ThemedText style={styles.stockInfoLabel}>Stock mínimo:</ThemedText>
                                     <ThemedText style={styles.stockInfoValue}>{inventario.stock_minimo}</ThemedText>
                                 </View>
                            </View>
                        </ThemedView>

                        {/* Formulario de Ajuste */}
                        <ThemedView style={styles.sectionCard}>
                            {/* Switch Entrada/Salida */}
                            <TouchableOpacity style={styles.switchContainer} onPress={toggleTipoAjuste} disabled={isAdjusting}>
                                 <View style={[styles.switchButton, esEntrada && styles.switchActiveEntrada]}>
                                     <IconSymbol name="arrow.down.circle.fill" size={18} color={esEntrada ? '#fff' : Colors.success} />
                                     <ThemedText style={[styles.switchText, esEntrada && styles.switchTextActive]}>Entrada</ThemedText>
                                 </View>
                                 <View style={[styles.switchButton, !esEntrada && styles.switchActiveSalida]}>
                                     <IconSymbol name="arrow.up.circle.fill" size={18} color={!esEntrada ? '#fff' : Colors.danger} />
                                     <ThemedText style={[styles.switchText, !esEntrada && styles.switchTextActive]}>Salida</ThemedText>
                                 </View>
                            </TouchableOpacity>

                            <ThemedText style={styles.sectionTitle}>{tituloPantalla}</ThemedText>

                            {/* Cantidad */}
                            <View style={FormStyles.formGroup}>
                                <ThemedText style={FormStyles.label}>Cantidad a {esEntrada ? 'agregar' : 'restar'}: *</ThemedText>
                                <View style={styles.quantityControl}>
                                    <TouchableOpacity style={styles.quantityButton} onPress={decrementCantidad} disabled={isAdjusting}>
                                        <IconSymbol name="minus" size={18} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[FormStyles.input, styles.quantityInput, errors.cantidad && FormStyles.inputError]}
                                        value={formData.cantidad}
                                        onChangeText={(text) => handleChange('cantidad', text.replace(/[^0-9]/g, ''))}
                                        keyboardType="numeric" textAlign="center" editable={!isAdjusting}
                                        onBlur={() => { if (!formData.cantidad) handleChange('cantidad', '1'); }}
                                    />
                                    <TouchableOpacity style={styles.quantityButton} onPress={incrementCantidad} disabled={isAdjusting}>
                                        <IconSymbol name="plus" size={18} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>
                                {errors.cantidad && <ThemedText style={FormStyles.errorText}>{errors.cantidad}</ThemedText>}
                                {itemError && !errors.cantidad && !errors.motivo && !errors.lote_origen_id && (
                                     <ThemedText style={[FormStyles.errorText, {marginTop: 5}]}>{itemError}</ThemedText>
                                )}
                            </View>

                             {/* Selector de Lote Origen (SOLO PARA ENTRADAS) */}
                            {esEntrada && (
                                <View style={FormStyles.formGroup}>
                                    <ThemedText style={FormStyles.label}>Lote de Origen: *</ThemedText>
                                    <TouchableOpacity
                                        style={[FormStyles.input, styles.pickerTrigger, errors.lote_origen_id && FormStyles.inputError]}
                                        onPress={() => setShowLotePicker(true)}
                                        disabled={isAdjusting || isLoadingLotes}
                                    >
                                        <ThemedText style={[styles.pickerText, !formData.lote_origen_id && styles.placeholderText]} numberOfLines={1}>
                                            {isLoadingLotes ? "Cargando lotes..." : selectedLoteInfo ? `#${selectedLoteInfo.id} - ${selectedLoteInfo.descripcion || 'Sin desc.'} (${selectedLoteInfo.cantidad_disponible_kg || 0} kg disp.)` : 'Seleccionar Lote'}
                                        </ThemedText>
                                        <IconSymbol name="chevron.down" size={20} color={Colors.light.textSecondary} />
                                    </TouchableOpacity>
                                    {errors.lote_origen_id && <ThemedText style={FormStyles.errorText}>{errors.lote_origen_id}</ThemedText>}
                                    {selectedLoteInfo && (
                                         <View style={styles.loteInfoMini}>
                                             <ThemedText style={styles.loteInfoMiniText}>Prov: {selectedLoteInfo.proveedor?.nombre || 'N/A'} | Ing: {new Date(selectedLoteInfo.fecha_ingreso).toLocaleDateString()}</ThemedText>
                                         </View>
                                     )}
                                </View>
                            )}

                            {/* Motivo */}
                            <View style={FormStyles.formGroup}>
                                <ThemedText style={FormStyles.label}>Motivo: *</ThemedText>
                                <TextInput
                                    style={[FormStyles.input, styles.motivoInput, errors.motivo && FormStyles.inputError]}
                                    value={formData.motivo} onChangeText={(text) => handleChange('motivo', text)}
                                    placeholder={esEntrada ? 'Ej: Compra, Devolución...' : 'Ej: Merma, Consumo...'}
                                    placeholderTextColor={Colors.light.placeholder} multiline numberOfLines={3} editable={!isAdjusting}
                                />
                                {errors.motivo && <ThemedText style={FormStyles.errorText}>{errors.motivo}</ThemedText>}
                            </View>
                        </ThemedView>
                    </ScrollView>

                    {/* Botones de Acción */}
                    <ActionButtons
                        onSave={handleRegistrarAjuste}
                        onCancel={() => router.back()}
                        isSubmitting={isAdjusting}
                        saveText="Registrar Ajuste"
                    />

                    {/* Lote Picker Dialog */}
                    {esEntrada && (
                        <LotePickerDialog
                            visible={showLotePicker}
                            lotes={lotesDisponibles}
                            selectedLote={formData.lote_origen_id || null}
                            loading={isLoadingLotes}
                            onSelect={(lote) => {
                                handleChange('lote_origen_id', lote.id.toString());
                                setShowLotePicker(false);
                            }}
                            onCancel={() => setShowLotePicker(false)}
                        />
                    )}
                </View>
            )}
        </ScreenContainer>
    );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 10, fontSize: 16, color: Colors.light.textSecondary },
    productCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, ...Shadows.small },
    productName: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 4 },
    productDescription: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 8 },
    almacenText: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 12 },
    stockInfoContainer: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: 12 },
    stockInfoItem: { alignItems: 'center' },
    stockInfoLabel: { fontSize: 13, color: Colors.light.textSecondary },
    stockInfoValue: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
    sectionCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, ...Shadows.small },
    switchContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, backgroundColor: Colors.light.inputBackground, borderRadius: 8, overflow: 'hidden' },
    switchButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
    switchActiveEntrada: { backgroundColor: Colors.success },
    switchActiveSalida: { backgroundColor: Colors.danger },
    switchText: { fontSize: 16, fontWeight: '500', color: Colors.light.textSecondary },
    switchTextActive: { color: '#fff' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: Colors.light.text, textAlign: 'center' },
    quantityControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    quantityButton: { padding: 10, backgroundColor: Colors.light.inputBackground, borderRadius: 8, marginHorizontal: 15 },
    quantityInput: { width: 80, paddingVertical: 10, fontSize: 18, fontWeight: 'bold' },
    pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    pickerText: { fontSize: 16, flex: 1, marginRight: 8, color: Colors.light.text },
    placeholderText: { color: Colors.light.placeholder },
    inputErrorBorder: { borderColor: Colors.danger },
    loteInfoMini: { marginTop: 6, padding: 8, backgroundColor: Colors.light.inputBackground + '80', borderRadius: 4, borderLeftWidth: 3, borderLeftColor: Colors.info },
    loteInfoMiniText: { fontSize: 13, color: Colors.light.textSecondary },
    motivoInput: { minHeight: 80, textAlignVertical: 'top' },
});
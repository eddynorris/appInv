// app/inventarios/index.tsx - Refactorizado a EnhancedCardList
import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList'; // Re-importar
import { useInventarios } from '@/hooks/crud/useInventarios';
import { Inventario, AlmacenSimple } from '@/models';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';
import AlmacenPickerDialog from '@/components/data/AlmacenPickerDialog';

export default function InventarioIndexScreen() {
    const [showAlmacenPicker, setShowAlmacenPicker] = useState(false);

    const {
        inventarios,
        isLoading,
        error,
        almacenes,
        isAdmin,
        filters,
        handleAlmacenFilterChange,
        handleSearchFilterChange,
        toggleLowStockFilter,
        clearFilters,
        refresh,
        deleteInventario,
    } = useInventarios();

    const handleSearchSubmit = useCallback(() => {
        // No action needed for local filtering
    }, []);

    const handleSelectAlmacen = useCallback((almacen: AlmacenSimple) => {
        handleAlmacenFilterChange(almacen ? almacen.id.toString() : '');
        setShowAlmacenPicker(false);
    }, [handleAlmacenFilterChange]);

    const selectedAlmacenNombre = useMemo(() => {
        if (!filters.almacen_id) return 'Todos';
        return almacenes.find(a => a.id.toString() === filters.almacen_id)?.nombre || 'Desconocido';
    }, [filters.almacen_id, almacenes]);

    // Render card para EnhancedCardList (sin TouchableOpacity exterior)
    const renderInventarioCardInternal = useCallback((item: Inventario) => {
        const isLowStock = item.cantidad <= item.stock_minimo;
        return (
            // El View exterior es manejado por EnhancedCardList, solo renderizamos el contenido
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <ThemedText style={styles.cardTitle} numberOfLines={1}>
                        {item.presentacion?.nombre || 'Producto sin nombre'}
                    </ThemedText>
                    {/* El botón de borrado se maneja a través de actions en EnhancedCardList */}
                </View>
                <ThemedText style={styles.cardSubtitle} numberOfLines={1}>
                    {item.presentacion?.producto?.nombre || 'Sin descripción'}
                </ThemedText>
                <View style={styles.cardDetailsRow}>
                    <IconSymbol name="shippingbox.fill" size={14} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.cardDetailText} numberOfLines={1}>
                        Almacén: {item.almacen?.nombre || 'N/A'}
                    </ThemedText>
                </View>
                <View style={styles.cardDetailsRow}>
                    <IconSymbol name={isLowStock ? "exclamationmark.triangle.fill" : "archivebox.fill"} size={14} color={isLowStock ? Colors.danger : Colors.success} />
                    <ThemedText style={[styles.cardDetailText, isLowStock && styles.lowStockText]}>
                        Stock: <ThemedText>{String(item.cantidad ?? 0)}</ThemedText> (Mín: <ThemedText>{String(item.stock_minimo ?? 0)}</ThemedText>)
                    </ThemedText>
                </View>
                {item.lote && (
                    <View style={styles.cardDetailsRow}>
                        <IconSymbol name="tag.fill" size={14} color={Colors.light.textSecondary} />
                        <ThemedText style={styles.cardDetailText} numberOfLines={1}>
                            Lote: #{String(item.lote.id ?? 'N/A')} - {item.lote.descripcion || 'Sin desc.'}
                        </ThemedText>
                    </View>
                )}
            </View>
        );
    }, []); // Dependencias vacías si no usa estado/props externos directamente

    // --- Renderizado Condicional del Contenido ---
    const renderContent = () => {
        // Mostrar filtros siempre
        return (
            <ThemedView style={styles.container}>
                {/* Sección de Filtros (sin cambios) */}
                <View style={styles.filterSection}>
                     <View style={styles.searchRow}>
                        <View style={styles.searchInputContainer}>
                            <IconSymbol name="magnifyingglass" size={20} color={Colors.light.icon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar producto, almacén..."
                                value={filters.search}
                                onChangeText={handleSearchFilterChange}
                                placeholderTextColor={Colors.light.placeholder}
                                returnKeyType="search"
                                onSubmitEditing={handleSearchSubmit}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {filters.search !== '' && (
                                <TouchableOpacity onPress={() => handleSearchFilterChange('')}>
                                    <IconSymbol name="xmark.circle.fill" size={20} color={Colors.light.icon} />
                                </TouchableOpacity>
                            )}
                        </View>
                     </View>
                     <View style={styles.filterButtonsRow}>
                        {isAdmin && (
                            <TouchableOpacity style={styles.filterButton} onPress={() => setShowAlmacenPicker(true)} disabled={isLoading}>
                                <IconSymbol name="shippingbox" size={16} color={Colors.light.textSecondary}/>
                                <ThemedText style={styles.filterButtonText} numberOfLines={1}>{selectedAlmacenNombre}</ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.filterButton, filters.stock_bajo && styles.filterButtonActive]}
                            onPress={toggleLowStockFilter}
                            disabled={isLoading}
                        >
                            <IconSymbol name="exclamationmark.triangle" size={16} color={filters.stock_bajo ? Colors.warning : Colors.light.textSecondary} />
                            <ThemedText style={styles.filterButtonText}>Bajo Stock</ThemedText>
                        </TouchableOpacity>
                         <TouchableOpacity style={styles.filterButton} onPress={clearFilters} disabled={isLoading}>
                             <IconSymbol name="arrow.counterclockwise" size={16} color={Colors.light.textSecondary} />
                            <ThemedText style={styles.filterButtonText}>Limpiar</ThemedText>
                         </TouchableOpacity>
                     </View>
                </View>

                {/* Usar EnhancedCardList */}
                <EnhancedCardList
                    data={inventarios}
                    isLoading={isLoading}
                    error={error}
                    baseRoute="/inventarios" // Ruta base para acciones
                    renderCard={renderInventarioCardInternal}
                    pagination={{ // Simular paginación local o deshabilitarla
                        currentPage: 1,
                        totalPages: 1,
                        itemsPerPage: inventarios.length, // Mostrar todos los filtrados
                        totalItems: inventarios.length,
                        onPageChange: () => {}, // No aplica para local
                        // onItemsPerPageChange: () => {}, // No aplica para local
                    }}
                    // Sorting no aplica con filtrado local simple
                    actions={{
                        // Acción 'View' redirige a 'ajustar'
                        onView: false, // No hay pantalla de detalle para inventario
                        onEdit: false, // No hay pantalla de edición para inventario
                        onDelete: isAdmin, // Permitir borrar si es admin
                    }}
                    deleteOptions={ isAdmin ? { // Solo si es admin
                        title: 'Eliminar Registro de Inventario',
                        message: '¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.',
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        onDelete: async (id) => await deleteInventario(Number(id)) // Usar la función del hook
                    } : undefined }
                    emptyMessage="No se encontraron registros con los filtros actuales."
                    onRefresh={refresh}
                    onCardPress={(item) => router.push({ pathname: '/inventarios/ajustar', params: { id: item.id } })} // Navegar al ajustar al presionar tarjeta
                    numColumns={1}
                />
            </ThemedView>
        );
    };

    return (
        <ScreenContainer
            title="Inventario"
            scrollable={false} // EnhancedCardList maneja su propio scroll
        >
            <Stack.Screen options={{ title: 'Inventario' }} />

            {renderContent()}

            {isAdmin && (
                <AlmacenPickerDialog
                    visible={showAlmacenPicker}
                    almacenes={almacenes}
                    onSelect={handleSelectAlmacen}
                    onCancel={() => setShowAlmacenPicker(false)}
                />
            )}
        </ScreenContainer>
    );
}

// --- ESTILOS --- (Mantener los estilos relevantes)
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterSection: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.inputBackground,
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        height: 44,
        paddingHorizontal: 8,
        fontSize: 16,
        color: Colors.light.text,
    },
    filterButtonsRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.inputBackground,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        minWidth: 100,
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.light.inputBackground,
    },
    filterButtonActive: {
        backgroundColor: Colors.light.tint + '1A',
        borderColor: Colors.light.tint,
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    // Estilos de la tarjeta interna (cardContent y sub-elementos)
     cardContent: {
        padding: 12, // Padding interno de la tarjeta
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Alinea el título y el botón (si existiera)
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        flex: 1, // Ocupa el espacio disponible
        marginRight: 8, // Espacio si hubiera un botón
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 8,
    },
    cardDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    cardDetailText: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        flex: 1, // Permite que el texto se ajuste
    },
    lowStockText: {
        color: Colors.danger,
        fontWeight: 'bold',
    },
    // Quitar estilos de FlatList y summary que ya no se usan directamente
    // listContentContainer, cardContainer (exterior), summaryContainer, summaryText
    // emptyContainer, errorContainer, loadingContainer (EnhancedCardList los maneja internamente)
});
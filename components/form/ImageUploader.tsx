// components/form/ImageUploader.tsx
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export interface FileInfo {
  uri: string;
  name: string;
  type: string;
}

interface ImageUploaderProps {
  value: FileInfo | null;
  onChange: (file: FileInfo | null) => void;
  existingFile?: string | null;
  onExistingFileRemove?: () => void;
  onExistingFileView?: () => void;
  allowedTypes?: ('image' | 'document')[];
  maxSize?: number; // en bytes
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  existingFile,
  onExistingFileRemove,
  onExistingFileView,
  allowedTypes = ['image'],
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  label = 'Archivo',
  required = false,
  error,
  disabled = false
}: ImageUploaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Solicitar permisos al montar el componente
  useEffect(() => {
    const requestPermissions = async () => {
      if (allowedTypes.includes('image')) {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          console.log('Permisos no concedidos para cámara o galería');
        }
      }
    };
    
    requestPermissions();
  }, [allowedTypes]);

  // Seleccionar imagen desde la galería
  const pickImage = async () => {
    if (disabled) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > maxSize) {
          Alert.alert('Error', `El archivo es demasiado grande. El tamaño máximo es ${(maxSize / (1024 * 1024)).toFixed(1)}MB.`);
          return;
        }
        
        // Determinar el tipo MIME
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        const mimeType = fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`;
        
        onChange({
          uri: asset.uri,
          name: asset.fileName || `archivo.${fileType}`,
          type: mimeType
        });
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto con la cámara
  const takePhoto = async () => {
    if (disabled || !allowedTypes.includes('image')) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > maxSize) {
          Alert.alert('Error', `El archivo es demasiado grande. El tamaño máximo es ${(maxSize / (1024 * 1024)).toFixed(1)}MB.`);
          return;
        }
        
        // Determinar el tipo MIME
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        const mimeType = `image/${fileType}`;
        
        onChange({
          uri: asset.uri,
          name: asset.fileName || `foto.${fileType}`,
          type: mimeType
        });
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Seleccionar documento
  const pickDocument = async () => {
    if (disabled || !allowedTypes.includes('document')) return;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size > maxSize) {
          Alert.alert('Error', `El archivo es demasiado grande. El tamaño máximo es ${(maxSize / (1024 * 1024)).toFixed(1)}MB.`);
          return;
        }
        
        onChange({
          uri: asset.uri,
          name: asset.name || 'documento.pdf',
          type: asset.mimeType || 'application/pdf'
        });
      }
    } catch (error) {
      console.error('Error al seleccionar documento:', error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>
        {label}{required ? ' *' : ''}
      </ThemedText>
      
      {/* Archivo existente */}
      {existingFile && (
        <ThemedView style={styles.existingFile}>
          <IconSymbol 
            name={existingFile.endsWith('.pdf') ? "doc.fill" : "photo.fill"} 
            size={24} 
            color="#4CAF50" 
          />
          <ThemedText style={styles.existingFileText}>Archivo ya cargado</ThemedText>
          <View style={styles.actionButtons}>
            {onExistingFileView && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={onExistingFileView}
                disabled={disabled}
              >
                <IconSymbol name="eye.fill" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {onExistingFileRemove && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={onExistingFileRemove}
                disabled={disabled}
              >
                <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>
      )}
      
      {/* Archivo seleccionado */}
      {value && (
        <ThemedView style={styles.previewContainer}>
          <IconSymbol 
            name={value.type.includes('pdf') ? "doc.fill" : "photo.fill"} 
            size={24} 
            color="#0a7ea4" 
          />
          <ThemedText style={styles.previewText}>{value.name}</ThemedText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            onPress={() => onChange(null)}
            disabled={disabled}
          >
            <IconSymbol name="trash.fill" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </ThemedView>
      )}
      
      {/* Botones de acción */}
      {!disabled && (
        <ThemedView style={styles.uploadButtons}>
          {allowedTypes.includes('image') && (
            <>
              <TouchableOpacity 
                style={[styles.uploadButton, { backgroundColor: '#2196F3' }]}
                onPress={pickImage}
              >
                <IconSymbol name="photo" size={20} color="#FFFFFF" />
                <ThemedText style={styles.uploadButtonText}>Galería</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.uploadButton, { backgroundColor: '#4CAF50' }]}
                onPress={takePhoto}
              >
                <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
                <ThemedText style={styles.uploadButtonText}>Cámara</ThemedText>
              </TouchableOpacity>
            </>
          )}
          
          {allowedTypes.includes('document') && (
            <TouchableOpacity 
              style={[styles.uploadButton, { backgroundColor: '#9C27B0' }]}
              onPress={pickDocument}
            >
              <IconSymbol name="doc.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.uploadButtonText}>PDF</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}
      
      {/* Información de ayuda */}
      <ThemedText style={styles.helperText}>
        {allowedTypes.includes('image') && allowedTypes.includes('document')
          ? 'Formatos aceptados: JPG, PNG, PDF'
          : allowedTypes.includes('image')
            ? 'Formatos aceptados: JPG, PNG'
            : 'Formato aceptado: PDF'
        } (máx. {(maxSize / (1024 * 1024)).toFixed(1)}MB)
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  existingFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  existingFileText: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '500',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  previewText: {
    flex: 1,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    color: '#757575',
  },
});
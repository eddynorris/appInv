// hooks/useImageUploader.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export interface FileInfo {
  uri: string;
  name: string;
  type: string;
}

interface ImageUploaderOptions {
  maxSizeMB?: number;
  allowedTypes?: ('image' | 'document')[];
  initialFile?: FileInfo | null;
}

export function useImageUploader({
  maxSizeMB = 5,
  allowedTypes = ['image'],
  initialFile = null
}: ImageUploaderOptions = {}) {
  const [file, setFile] = useState<FileInfo | null>(initialFile);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

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

  // Función para validar tamaño de archivo
  const validateFileSize = async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && fileInfo.size > maxSizeBytes) {
        Alert.alert('Error', `El archivo es demasiado grande. El tamaño máximo es ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error al validar tamaño de archivo:', error);
      return false;
    }
  };

  // Función para determinar el tipo MIME
  const getMimeType = (uri: string, customType?: string): string => {
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1].toLowerCase();
    
    if (customType) return customType;
    if (fileType === 'pdf') return 'application/pdf';
    if (['jpg', 'jpeg', 'png'].includes(fileType)) return `image/${fileType}`;
    
    // Default
    return 'application/octet-stream';
  };

  // Seleccionar imagen desde la galería
  const pickImage = async () => {
    if (!allowedTypes.includes('image')) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo
        if (!(await validateFileSize(asset.uri))) return;
        
        // Determinar el tipo MIME
        const mimeType = getMimeType(asset.uri);
        
        setFile({
          uri: asset.uri,
          name: asset.fileName || `archivo.${asset.uri.split('.').pop()}`,
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
    if (!allowedTypes.includes('image')) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo
        if (!(await validateFileSize(asset.uri))) return;
        
        // Determinar el tipo MIME
        const mimeType = getMimeType(asset.uri);
        
        setFile({
          uri: asset.uri,
          name: asset.fileName || `foto.${asset.uri.split('.').pop()}`,
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
    if (!allowedTypes.includes('document')) return;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validar el tamaño del archivo
        if (!(await validateFileSize(asset.uri))) return;
        
        setFile({
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

  // Limpiar archivo
  const clearFile = () => setFile(null);

  return {
    file,
    setFile,
    pickImage,
    takePhoto,
    pickDocument,
    clearFile
  };
}
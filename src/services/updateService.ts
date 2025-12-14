import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Constants from 'expo-constants';
import { Linking, Alert } from 'react-native';
import * as Updates from 'expo-updates';

export interface AppUpdateInfo {
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes?: string;
  mandatory: boolean;
  releaseDate: string;
}

/**
 * Obtém a versão atual do app
 */
export const getCurrentVersion = (): string => {
  return Constants.expoConfig?.version || '1.0.0';
};

/**
 * Verifica atualizações OTA via Expo Updates
 */
export const checkOTAUpdate = async (): Promise<boolean> => {
  try {
    // Verifica se Updates está habilitado
    if (!Updates.isEnabled) {
      console.log('Updates não está habilitado');
      return false;
    }

    const update = await Updates.checkForUpdateAsync();
    console.log('Verificação OTA:', { isAvailable: update.isAvailable, manifest: update.manifest?.id });
    return update.isAvailable;
  } catch (error) {
    console.error('Erro ao verificar atualização OTA:', error);
    return false;
  }
};

/**
 * Baixa e aplica atualização OTA
 */
export const applyOTAUpdate = async (): Promise<void> => {
  try {
    if (!Updates.isEnabled) {
      Alert.alert('Aviso', 'Atualizações OTA não estão disponíveis. Certifique-se de que está usando um build de produção.');
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert('Atualizando...', 'Baixando atualização. O app será recarregado automaticamente.');
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } else {
      Alert.alert('Atualização', 'Você já está usando a versão mais recente.');
    }
  } catch (error) {
    console.error('Erro ao aplicar atualização OTA:', error);
    Alert.alert('Erro', 'Não foi possível aplicar a atualização. Tente novamente mais tarde.');
  }
};

/**
 * Obtém informações sobre atualizações disponíveis do Firebase (APK manual)
 */
export const checkForUpdates = async (): Promise<AppUpdateInfo | null> => {
  try {
    const updateDocRef = doc(db, 'app_updates', 'latest');
    const updateDoc = await getDoc(updateDocRef);

    if (!updateDoc.exists()) {
      return null;
    }

    const updateData = updateDoc.data() as AppUpdateInfo;
    const currentVersion = getCurrentVersion();

    // Compara versões (formato: "1.0.0")
    if (isNewerVersion(updateData.version, currentVersion)) {
      return updateData;
    }

    return null;
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
    return null;
  }
};

/**
 * Compara duas versões no formato "x.y.z"
 * Retorna true se a versão1 é mais nova que versão2
 */
const isNewerVersion = (version1: string, version2: string): boolean => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return true;
    if (v1Part < v2Part) return false;
  }

  return false;
};

/**
 * Abre o link de download do APK
 */
export const downloadUpdate = async (downloadUrl: string): Promise<void> => {
  try {
    const supported = await Linking.canOpenURL(downloadUrl);
    if (supported) {
      await Linking.openURL(downloadUrl);
    } else {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o link de download. Verifique sua conexão com a internet.'
      );
    }
  } catch (error) {
    console.error('Erro ao abrir link de download:', error);
    Alert.alert('Erro', 'Não foi possível abrir o link de download.');
  }
};

/**
 * Formata a data de lançamento para exibição
 */
export const formatReleaseDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};


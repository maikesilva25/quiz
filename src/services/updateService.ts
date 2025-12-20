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
 * Obtém informações detalhadas sobre atualizações OTA
 */
export const getOTAUpdateInfo = async (): Promise<{
  isEnabled: boolean;
  isAvailable: boolean;
  currentlyRunning: string | null;
  availableUpdate: string | null;
  error?: string;
}> => {
  try {
    // Verifica se Updates está disponível
    if (typeof Updates === 'undefined' || !Updates) {
      return {
        isEnabled: false,
        isAvailable: false,
        currentlyRunning: null,
        availableUpdate: null,
        error: 'Sistema de atualizações não está disponível',
      };
    }

    const isEnabled = Updates.isEnabled;
    const currentlyRunning = Updates.updateId || null;
    
    if (!isEnabled) {
      return {
        isEnabled: false,
        isAvailable: false,
        currentlyRunning,
        availableUpdate: null,
        error: 'Updates não está habilitado (pode estar em modo desenvolvimento)',
      };
    }

    // Verifica se o método está disponível
    if (typeof Updates.checkForUpdateAsync !== 'function') {
      return {
        isEnabled: false,
        isAvailable: false,
        currentlyRunning,
        availableUpdate: null,
        error: 'Função de verificação não está disponível (pode estar usando Expo Go)',
      };
    }

    const update = await Updates.checkForUpdateAsync();
    const availableUpdate = update.manifest?.id || null;
    
    console.log('Informações OTA:', {
      isEnabled,
      isAvailable: update.isAvailable,
      currentlyRunning,
      availableUpdate,
      manifest: update.manifest,
    });

    return {
      isEnabled: true,
      isAvailable: update.isAvailable,
      currentlyRunning,
      availableUpdate,
    };
  } catch (error: any) {
    console.error('Erro ao verificar atualização OTA:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error?.message) {
      if (error.message.includes('not supported in Expo Go')) {
        errorMessage = 'Atualizações OTA não funcionam no Expo Go. Use um build de produção.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      isEnabled: Updates?.isEnabled || false,
      isAvailable: false,
      currentlyRunning: Updates?.updateId || null,
      availableUpdate: null,
      error: errorMessage,
    };
  }
};

/**
 * Verifica atualizações OTA via Expo Updates
 */
export const checkOTAUpdate = async (): Promise<boolean> => {
  try {
    const info = await getOTAUpdateInfo();
    return info.isAvailable;
  } catch (error) {
    console.error('Erro ao verificar atualização OTA:', error);
    return false;
  }
};

/**
 * Baixa e aplica atualização OTA
 */
export const applyOTAUpdate = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Verifica se Updates está disponível
    if (typeof Updates === 'undefined' || !Updates) {
      return {
        success: false,
        message: 'Sistema de atualizações não está disponível.',
      };
    }

    if (!Updates.isEnabled) {
      return {
        success: false,
        message: 'Atualizações OTA não estão disponíveis. Certifique-se de que está usando um build de produção.',
      };
    }

    console.log('Verificando atualização OTA...', {
      isEnabled: Updates.isEnabled,
      updateId: Updates.updateId,
      channel: Updates.channel,
    });

    // Verifica se o método está disponível
    if (typeof Updates.checkForUpdateAsync !== 'function') {
      return {
        success: false,
        message: 'Função de verificação de atualização não está disponível. Você pode estar usando Expo Go.',
      };
    }

    const update = await Updates.checkForUpdateAsync();
    
    if (!update.isAvailable) {
      return {
        success: false,
        message: 'Você já está usando a versão mais recente.',
      };
    }

    console.log('Atualização disponível, baixando...');
    
    // Verifica se o método de fetch está disponível
    if (typeof Updates.fetchUpdateAsync !== 'function') {
      return {
        success: false,
        message: 'Função de download de atualização não está disponível.',
      };
    }

    const fetchResult = await Updates.fetchUpdateAsync();
    
    console.log('Resultado do fetchUpdateAsync:', {
      isNew: fetchResult.isNew,
      manifest: fetchResult.manifest?.id,
      updateId: Updates.updateId,
    });
    
    if (fetchResult.isNew) {
      console.log('Nova atualização baixada, recarregando app...');
      
      // Pequeno delay para garantir que o usuário veja a mensagem
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        if (typeof Updates.reloadAsync === 'function') {
          console.log('Chamando Updates.reloadAsync()...');
          await Updates.reloadAsync();
        } else {
          console.error('Updates.reloadAsync não está disponível');
          return {
            success: false,
            message: 'Função de recarregamento não está disponível. Por favor, reinicie o app manualmente.',
          };
        }
      } catch (reloadError) {
        console.error('Erro ao recarregar app:', reloadError);
        return {
          success: false,
          message: 'Erro ao aplicar atualização. Por favor, reinicie o app manualmente.',
        };
      }
      
      return {
        success: true,
        message: 'Atualização aplicada com sucesso!',
      };
    } else {
      console.log('Nenhuma atualização nova foi encontrada após o download');
      return {
        success: false,
        message: 'Nenhuma atualização nova foi encontrada. Você já está com a versão mais recente.',
      };
    }
  } catch (error: any) {
    console.error('Erro ao aplicar atualização OTA:', error);
    
    // Mensagens de erro mais específicas
    let errorMessage = 'Não foi possível aplicar a atualização.';
    
    if (error?.message) {
      if (error.message.includes('not supported in Expo Go')) {
        errorMessage = 'Atualizações OTA não funcionam no Expo Go. Use um build de produção.';
      } else if (error.message.includes('checkForUpdateAsync')) {
        errorMessage = 'Erro ao verificar atualizações. Verifique sua conexão com a internet.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      message: errorMessage,
    };
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


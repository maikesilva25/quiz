import * as Updates from 'expo-updates';

export interface UpdateStatus {
  isAvailable: boolean;
  isDownloaded: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  error: string | null;
  currentVersion?: string;
  updateVersion?: string;
}

export const checkForUpdates = async (): Promise<UpdateStatus> => {
  try {
    // Verificar se Updates está habilitado
    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        isDownloaded: false,
        isChecking: false,
        isDownloading: false,
        error: 'Atualizações automáticas não estão habilitadas neste app.',
      };
    }

    // Verificar atualizações
    const update = await Updates.checkForUpdateAsync();
    
    if (update.isAvailable) {
      // Baixar atualização
      await Updates.fetchUpdateAsync();
      
      return {
        isAvailable: true,
        isDownloaded: true,
        isChecking: false,
        isDownloading: false,
        error: null,
        currentVersion: Updates.updateId || 'N/A',
        updateVersion: update.manifest?.id || 'N/A',
      };
    }

    return {
      isAvailable: false,
      isDownloaded: false,
      isChecking: false,
      isDownloading: false,
      error: null,
      currentVersion: Updates.updateId || 'N/A',
    };
  } catch (error: any) {
    return {
      isAvailable: false,
      isDownloaded: false,
      isChecking: false,
      isDownloading: false,
      error: error.message || 'Erro ao verificar atualizações',
    };
  }
};

export const applyUpdate = async (): Promise<void> => {
  try {
    if (!Updates.isEnabled) {
      throw new Error('Atualizações automáticas não estão habilitadas');
    }

    await Updates.reloadAsync();
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao aplicar atualização');
  }
};

export const getCurrentVersion = (): string => {
  try {
    return Updates.updateId || Updates.manifest?.id || '1.0.0';
  } catch {
    return '1.0.0';
  }
};


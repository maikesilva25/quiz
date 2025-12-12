import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SystemSettings {
  appName?: string;
  maintenanceMode?: boolean;
  updatedAt?: Date;
  updatedBy?: string;
}

export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        appName: data.appName,
        maintenanceMode: data.maintenanceMode || false,
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }
};

export const subscribeToSettings = (
  callback: (settings: SystemSettings | null) => void
) => {
  const settingsRef = doc(db, 'settings', 'general');
  
  return onSnapshot(settingsRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback({
        appName: data.appName,
        maintenanceMode: data.maintenanceMode || false,
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Erro ao escutar configurações:', error);
    callback(null);
  });
};


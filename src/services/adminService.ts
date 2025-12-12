import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const isUserVerified = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().verified || false;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return false;
  }
};

export const isUserBlocked = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().blocked || false;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar bloqueio:', error);
    return false;
  }
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().isAdmin || false;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
};


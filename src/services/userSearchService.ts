import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    const term = searchTerm.toLowerCase();
    
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          adFreeUntil: data.adFreeUntil?.toDate(),
        } as User;
      })
      .filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};


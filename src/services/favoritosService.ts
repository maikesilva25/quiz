import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Oracao } from '../types';

export const getFavoritos = async (userId: string): Promise<Oracao[]> => {
  try {
    const q = query(collection(db, 'oracoes'), where('favorites', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        tags: data.tags || [],
        isPedidoOracao: data.isPedidoOracao || false,
        prayingUsers: data.prayingUsers || [],
        views: data.views || 0,
      } as Oracao;
    });
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return [];
  }
};


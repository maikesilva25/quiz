import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Oracao, User } from '../types';

export const searchOracoes = async (searchTerm: string): Promise<Oracao[]> => {
  try {
    const q = query(collection(db, 'oracoes'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const term = searchTerm.toLowerCase();
    
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          likes: data.likes || [],
          favorites: data.favorites || [],
          comments: data.comments || [],
          tags: data.tags || [],
          isPedidoOracao: data.isPedidoOracao || false,
          prayingUsers: data.prayingUsers || [],
          views: data.views || 0,
        } as Oracao;
      })
      .filter(oracao => 
        oracao.content.toLowerCase().includes(term) ||
        oracao.userName.toLowerCase().includes(term) ||
        (oracao.tags && oracao.tags.some(tag => tag.toLowerCase().includes(term)))
      );
  } catch (error) {
    console.error('Erro ao buscar orações:', error);
    return [];
  }
};

export const searchOracoesByUser = async (userId: string): Promise<Oracao[]> => {
  try {
    const q = query(collection(db, 'oracoes'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        likes: data.likes || [],
        favorites: data.favorites || [],
        comments: data.comments || [],
        tags: data.tags || [],
        isPedidoOracao: data.isPedidoOracao || false,
        prayingUsers: data.prayingUsers || [],
        views: data.views || 0,
      } as Oracao;
    });
  } catch (error) {
    console.error('Erro ao buscar orações do usuário:', error);
    return [];
  }
};

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


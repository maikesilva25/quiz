import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserStats } from '../types';

export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    const oracoesQuery = query(collection(db, 'oracoes'), where('userId', '==', userId));
    const oracoesSnapshot = await getDocs(oracoesQuery);
    
    let totalLikes = 0;
    let totalComentarios = 0;
    let totalViews = 0;
    
    oracoesSnapshot.forEach(doc => {
      const data = doc.data();
      totalLikes += (data.likes || []).length;
      totalComentarios += (data.comments || []).length;
      totalViews += data.views || 0;
    });
    
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    let totalSeguidores = 0;
    let totalSeguindo = 0;
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      totalSeguidores = (userData.followers || []).length;
      totalSeguindo = (userData.following || []).length;
    }
    
    return {
      totalOracoes: oracoesSnapshot.size,
      totalLikes,
      totalComentarios,
      totalViews,
      totalSeguidores,
      totalSeguindo,
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return {
      totalOracoes: 0,
      totalLikes: 0,
      totalComentarios: 0,
      totalViews: 0,
      totalSeguidores: 0,
      totalSeguindo: 0,
    };
  }
};


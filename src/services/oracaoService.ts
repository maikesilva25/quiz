import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  arrayUnion, 
  arrayRemove,
  getDoc,
  increment,
  Timestamp,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Oracao, OracaoTag } from '../types';
import { isUserVerified, isUserBlocked } from './adminService';
import { getBoostedOracoes } from './shopService';

export const uploadVideo = async (
  userId: string,
  userName: string,
  userPhotoURL: string | undefined,
  videoUri: string,
  content: string,
  tags?: string[],
  isPedidoOracao?: boolean
): Promise<string> => {
  const verified = await isUserVerified(userId);
  const blocked = await isUserBlocked(userId);
  
  if (blocked) {
    throw new Error('Você está bloqueado e não pode postar conteúdo');
  }
  
  if (!verified) {
    throw new Error('Apenas usuários verificados podem postar vídeos');
  }
  
  const response = await fetch(videoUri);
  const blob = await response.blob();
  const videoRef = ref(storage, `videos/${userId}/${Date.now()}.mp4`);
  await uploadBytes(videoRef, blob);
  const videoURL = await getDownloadURL(videoRef);
  
  const oracaoData: any = {
    userId,
    userName,
    userPhotoURL: userPhotoURL || null,
    type: 'video',
    content,
    videoURL,
    likes: [],
    comments: [],
    favorites: [],
    tags: tags || [],
    isPedidoOracao: isPedidoOracao || false,
    views: 0,
    createdAt: Timestamp.now(),
  };
  
  // Adicionar prayingUsers apenas se for pedido de oração
  if (isPedidoOracao) {
    oracaoData.prayingUsers = [];
  }
  
  const docRef = await addDoc(collection(db, 'oracoes'), oracaoData);
  return docRef.id;
};

export const uploadPhoto = async (
  userId: string,
  userName: string,
  userPhotoURL: string | undefined,
  photoUri: string,
  content: string,
  tags?: string[],
  isPedidoOracao?: boolean
): Promise<string> => {
  const verified = await isUserVerified(userId);
  const blocked = await isUserBlocked(userId);
  
  if (blocked) {
    throw new Error('Você está bloqueado e não pode postar conteúdo');
  }
  
  if (!verified) {
    throw new Error('Apenas usuários verificados podem postar fotos');
  }
  
  const response = await fetch(photoUri);
  const blob = await response.blob();
  const photoRef = ref(storage, `photos/${userId}/${Date.now()}.jpg`);
  await uploadBytes(photoRef, blob);
  const photoURL = await getDownloadURL(photoRef);
  
  const oracaoData: any = {
    userId,
    userName,
    userPhotoURL: userPhotoURL || null,
    type: 'photo',
    content,
    photoURL,
    likes: [],
    comments: [],
    favorites: [],
    tags: tags || [],
    isPedidoOracao: isPedidoOracao || false,
    views: 0,
    createdAt: Timestamp.now(),
  };
  
  // Adicionar prayingUsers apenas se for pedido de oração
  if (isPedidoOracao) {
    oracaoData.prayingUsers = [];
  }
  
  const docRef = await addDoc(collection(db, 'oracoes'), oracaoData);
  return docRef.id;
};

export const uploadText = async (
  userId: string,
  userName: string,
  userPhotoURL: string | undefined,
  content: string,
  tags?: string[],
  isPedidoOracao?: boolean
): Promise<string> => {
  const verified = await isUserVerified(userId);
  const blocked = await isUserBlocked(userId);
  
  if (blocked) {
    throw new Error('Você está bloqueado e não pode postar conteúdo');
  }
  
  if (!verified) {
    throw new Error('Apenas usuários verificados podem postar orações');
  }
  
  const oracaoData: any = {
    userId,
    userName,
    userPhotoURL: userPhotoURL || null,
    type: 'text',
    content,
    likes: [],
    comments: [],
    favorites: [],
    tags: tags || [],
    isPedidoOracao: isPedidoOracao || false,
    views: 0,
    createdAt: Timestamp.now(),
  };
  
  // Adicionar prayingUsers apenas se for pedido de oração
  if (isPedidoOracao) {
    oracaoData.prayingUsers = [];
  }
  
  const docRef = await addDoc(collection(db, 'oracoes'), oracaoData);
  return docRef.id;
};

export const getOracoes = async (): Promise<Oracao[]> => {
  try {
    const boosts = await getBoostedOracoes();
    const boostedIds = new Set(boosts.map(b => b.oracaoId));
    
    const q = query(collection(db, 'oracoes'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const oracoes = querySnapshot.docs.map(doc => {
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
    
    const sorted = oracoes.sort((a, b) => {
      const aBoosted = boostedIds.has(a.id);
      const bBoosted = boostedIds.has(b.id);
      
      if (aBoosted && !bBoosted) return -1;
      if (!aBoosted && bBoosted) return 1;
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return sorted;
  } catch (error) {
    console.error('Erro ao buscar orações:', error);
    return [];
  }
};

export const likeOracao = async (oracaoId: string, userId: string) => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  await updateDoc(oracaoRef, {
    likes: arrayUnion(userId),
  });
};

export const unlikeOracao = async (oracaoId: string, userId: string) => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  await updateDoc(oracaoRef, {
    likes: arrayRemove(userId),
  });
};

export const favoriteOracao = async (oracaoId: string, userId: string) => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  await updateDoc(oracaoRef, {
    favorites: arrayUnion(userId),
  });
};

export const unfavoriteOracao = async (oracaoId: string, userId: string) => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  await updateDoc(oracaoRef, {
    favorites: arrayRemove(userId),
  });
};

export const addComment = async (
  oracaoId: string,
  userId: string,
  userName: string,
  userPhotoURL: string | undefined,
  text: string
) => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  const oracaoDoc = await getDoc(oracaoRef);
  const comments = oracaoDoc.data()?.comments || [];
  
  comments.push({
    id: Date.now().toString(),
    userId,
    userName,
    userPhotoURL: userPhotoURL || null,
    text,
    createdAt: Timestamp.now(),
  });
  
  await updateDoc(oracaoRef, {
    comments,
  });
};

export const incrementOracaoView = async (oracaoId: string) => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  await updateDoc(oracaoRef, {
    views: increment(1),
  });
};

export const togglePraying = async (oracaoId: string, userId: string) => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  const oracaoDoc = await getDoc(oracaoRef);
  const prayingUsers = oracaoDoc.data()?.prayingUsers || [];
  
  if (prayingUsers.includes(userId)) {
    await updateDoc(oracaoRef, {
      prayingUsers: arrayRemove(userId),
    });
  } else {
    await updateDoc(oracaoRef, {
      prayingUsers: arrayUnion(userId),
    });
  }
};

export const updateOracao = async (
  oracaoId: string,
  userId: string,
  updates: {
    content?: string;
    tags?: string[];
    isPedidoOracao?: boolean;
  }
): Promise<void> => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  const oracaoDoc = await getDoc(oracaoRef);
  
  if (!oracaoDoc.exists()) {
    throw new Error('Oração não encontrada');
  }
  
  const oracaoData = oracaoDoc.data();
  
  // Verificar se o usuário é o dono da oração
  if (oracaoData.userId !== userId) {
    throw new Error('Você não tem permissão para editar esta oração');
  }
  
  const updateData: any = {};
  
  if (updates.content !== undefined) {
    updateData.content = updates.content;
  }
  
  if (updates.tags !== undefined) {
    updateData.tags = updates.tags;
  }
  
  if (updates.isPedidoOracao !== undefined) {
    updateData.isPedidoOracao = updates.isPedidoOracao;
    // Se for pedido de oração e não tiver prayingUsers, adicionar array vazio
    if (updates.isPedidoOracao && !oracaoData.prayingUsers) {
      updateData.prayingUsers = [];
    }
  }
  
  await updateDoc(oracaoRef, updateData);
};

export const deleteOracao = async (oracaoId: string, userId: string): Promise<void> => {
  const oracaoRef = doc(db, 'oracoes', oracaoId);
  const oracaoDoc = await getDoc(oracaoRef);
  
  if (!oracaoDoc.exists()) {
    throw new Error('Oração não encontrada');
  }
  
  const oracaoData = oracaoDoc.data();
  
  // Verificar se o usuário é o dono da oração
  if (oracaoData.userId !== userId) {
    throw new Error('Você não tem permissão para excluir esta oração');
  }
  
  // Excluir mídia do Storage se existir
  try {
    if (oracaoData.videoURL) {
      const videoRef = ref(storage, oracaoData.videoURL);
      // Note: deleteObject não está disponível na versão web, mas podemos tentar
      // Por enquanto, apenas excluímos o documento
    }
    if (oracaoData.photoURL) {
      const photoRef = ref(storage, oracaoData.photoURL);
      // Note: deleteObject não está disponível na versão web, mas podemos tentar
      // Por enquanto, apenas excluímos o documento
    }
  } catch (error) {
    console.error('Erro ao excluir mídia:', error);
    // Continuar mesmo se houver erro ao excluir mídia
  }
  
  await deleteDoc(oracaoRef);
};


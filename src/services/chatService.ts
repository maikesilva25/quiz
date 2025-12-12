import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  getDoc,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Chat, Message } from '../types';

export const createChat = async (
  participants: string[],
  type: 'individual' | 'group' = 'individual',
  name?: string,
  createdBy?: string
): Promise<string> => {
  const chatData = {
    participants,
    type,
    name: type === 'group' ? name : undefined,
    createdBy: type === 'group' ? createdBy : undefined,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    unreadCount: {},
  };
  
  const docRef = await addDoc(collection(db, 'chats'), chatData);
  return docRef.id;
};

export const createGroupChat = async (
  participants: string[],
  name: string,
  createdBy: string
): Promise<string> => {
  return createChat(participants, 'group', name, createdBy);
};

export const addParticipantToGroup = async (chatId: string, userId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  const chatDoc = await getDoc(chatRef);
  
  if (chatDoc.exists()) {
    const data = chatDoc.data();
    const participants = data.participants || [];
    
    if (!participants.includes(userId)) {
      await updateDoc(chatRef, {
        participants: [...participants, userId],
      });
    }
  }
};

export const removeParticipantFromGroup = async (chatId: string, userId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  const chatDoc = await getDoc(chatRef);
  
  if (chatDoc.exists()) {
    const data = chatDoc.data();
    const participants = data.participants || [];
    
    await updateDoc(chatRef, {
      participants: participants.filter((id: string) => id !== userId),
    });
  }
};

export const banUserFromGroup = async (chatId: string, userId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  const chatDoc = await getDoc(chatRef);
  
  if (chatDoc.exists()) {
    const data = chatDoc.data();
    const participants = data.participants || [];
    const bannedUsers = data.bannedUsers || [];
    
    // Remove do grupo e adiciona à lista de banidos
    await updateDoc(chatRef, {
      participants: participants.filter((id: string) => id !== userId),
      bannedUsers: bannedUsers.includes(userId) ? bannedUsers : [...bannedUsers, userId],
    });
  }
};

export const unbanUserFromGroup = async (chatId: string, userId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  const chatDoc = await getDoc(chatRef);
  
  if (chatDoc.exists()) {
    const data = chatDoc.data();
    const bannedUsers = data.bannedUsers || [];
    
    // Remove da lista de banidos
    await updateDoc(chatRef, {
      bannedUsers: bannedUsers.filter((id: string) => id !== userId),
    });
  }
};

export const getChats = async (userId: string): Promise<Chat[]> => {
  try {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        participants: data.participants || [],
        type: data.type || 'individual',
        name: data.name,
        createdBy: data.createdBy,
        bannedUsers: data.bannedUsers || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
        } : undefined,
        unreadCount: data.unreadCount || {},
      } as Chat;
    });
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    return [];
  }
};

export const getMessages = async (chatId: string): Promise<Message[]> => {
  try {
    // Primeiro tenta com orderBy (requer índice)
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId: data.chatId || chatId,
          senderId: data.senderId || '',
          senderName: data.senderName,
          text: data.text || '',
          read: data.read || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Message;
      });
    } catch (orderByError: any) {
      // Se falhar por falta de índice, busca sem orderBy e ordena manualmente
      if (orderByError.code === 'failed-precondition') {
        console.warn('Índice não encontrado, buscando sem orderBy...');
        const q = query(
          collection(db, 'messages'),
          where('chatId', '==', chatId)
        );
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            chatId: data.chatId || chatId,
            senderId: data.senderId || '',
            senderName: data.senderName,
            text: data.text || '',
            read: data.read || false,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Message;
        });
        // Ordenar manualmente por data
        return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
      throw orderByError;
    }
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return [];
  }
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<string> => {
  const messageData = {
    chatId,
    senderId,
    senderName,
    text,
    read: false,
    createdAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, 'messages'), messageData);
  
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: {
      text,
      senderId,
      createdAt: Timestamp.now(),
    },
    updatedAt: Timestamp.now(),
  });
  
  return docRef.id;
};

export const getChat = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      const data = chatDoc.data();
      return {
        id: chatDoc.id,
        participants: data.participants || [],
        type: data.type || 'individual',
        name: data.name,
        createdBy: data.createdBy,
        bannedUsers: data.bannedUsers || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
        } : undefined,
        unreadCount: data.unreadCount || {},
      } as Chat;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar chat:', error);
    return null;
  }
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    where('senderId', '!=', userId),
    where('read', '==', false)
  );
  
  const querySnapshot = await getDocs(messagesQuery);
  const updates = querySnapshot.docs.map(doc => 
    updateDoc(doc.ref, { read: true })
  );
  
  await Promise.all(updates);
  
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCount.${userId}`]: 0,
  });
};


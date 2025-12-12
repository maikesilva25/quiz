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
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { StudyRoom } from '../types';

export const createStudyRoom = async (
  name: string,
  description: string,
  topic: string,
  createdBy: string,
  createdByName: string,
  isPublic: boolean = true,
  maxParticipants?: number,
  tags?: string[]
): Promise<string> => {
  const roomData = {
    name,
    description,
    topic,
    createdBy,
    createdByName,
    participants: [createdBy],
    maxParticipants: maxParticipants || 50,
    isPublic,
    tags: tags || [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, 'studyRooms'), roomData);
  return docRef.id;
};

export const getStudyRooms = async (): Promise<StudyRoom[]> => {
  try {
    const q = query(
      collection(db, 'studyRooms'),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
        } : undefined,
      } as StudyRoom;
    });
  } catch (error) {
    console.error('Erro ao buscar salas de estudo:', error);
    // Fallback sem orderBy se índice não existir
    try {
      const q = query(
        collection(db, 'studyRooms'),
        where('isPublic', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const rooms = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
          } : undefined,
        } as StudyRoom;
      });
      return rooms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError);
      return [];
    }
  }
};

export const getStudyRoom = async (roomId: string): Promise<StudyRoom | null> => {
  try {
    const roomDoc = await getDoc(doc(db, 'studyRooms', roomId));
    if (roomDoc.exists()) {
      const data = roomDoc.data();
      return {
        id: roomDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
        } : undefined,
      } as StudyRoom;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar sala de estudo:', error);
    return null;
  }
};

export const joinStudyRoom = async (roomId: string, userId: string): Promise<boolean> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (roomDoc.exists()) {
      const data = roomDoc.data();
      const participants = data.participants || [];
      const maxParticipants = data.maxParticipants || 50;
      
      if (participants.includes(userId)) {
        return true; // Já está participando
      }
      
      if (participants.length >= maxParticipants) {
        throw new Error('Sala cheia');
      }
      
      await updateDoc(roomRef, {
        participants: arrayUnion(userId),
        updatedAt: Timestamp.now(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao entrar na sala:', error);
    throw error;
  }
};

export const leaveStudyRoom = async (roomId: string, userId: string): Promise<void> => {
  try {
    const roomRef = doc(db, 'studyRooms', roomId);
    await updateDoc(roomRef, {
      participants: arrayRemove(userId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao sair da sala:', error);
    throw error;
  }
};

export const sendStudyMessage = async (
  roomId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<string> => {
  const messageData = {
    roomId,
    senderId,
    senderName,
    text,
    createdAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, 'studyMessages'), messageData);
  
  // Atualizar última mensagem da sala
  await updateDoc(doc(db, 'studyRooms', roomId), {
    lastMessage: {
      text,
      senderId,
      senderName,
      createdAt: Timestamp.now(),
    },
    updatedAt: Timestamp.now(),
  });
  
  return docRef.id;
};

export const getStudyMessages = async (roomId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'studyMessages'),
      where('roomId', '==', roomId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error: any) {
    console.error('Erro ao buscar mensagens:', error);
    // Fallback sem orderBy
    if (error.code === 'failed-precondition') {
      try {
        const q = query(
          collection(db, 'studyMessages'),
          where('roomId', '==', roomId)
        );
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });
        return messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        return [];
      }
    }
    return [];
  }
};

export const subscribeToStudyMessages = (
  roomId: string,
  callback: (messages: any[]) => void,
  onError?: (error: any) => void
) => {
  try {
    const q = query(
      collection(db, 'studyMessages'),
      where('roomId', '==', roomId),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      callback(messages);
    }, (error: any) => {
      console.error('Erro ao escutar mensagens:', error);
      if (error.code === 'failed-precondition') {
        // Fallback sem orderBy
        const qWithoutOrder = query(
          collection(db, 'studyMessages'),
          where('roomId', '==', roomId)
        );
        return onSnapshot(qWithoutOrder, (querySnapshot) => {
          const messages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            };
          });
          messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          callback(messages);
        });
      }
      if (onError) onError(error);
    });
  } catch (error) {
    console.error('Erro ao configurar listener:', error);
    if (onError) onError(error);
    return () => {};
  }
};

export const subscribeToStudyRooms = (
  callback: (rooms: StudyRoom[]) => void
) => {
  try {
    const q = query(
      collection(db, 'studyRooms'),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const rooms = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
          } : undefined,
        } as StudyRoom;
      });
      callback(rooms);
    }, (error: any) => {
      console.error('Erro ao escutar salas:', error);
      // Fallback sem orderBy
      if (error.code === 'failed-precondition') {
        const qWithoutOrder = query(
          collection(db, 'studyRooms'),
          where('isPublic', '==', true)
        );
        return onSnapshot(qWithoutOrder, (querySnapshot) => {
          const rooms = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              lastMessage: data.lastMessage ? {
                ...data.lastMessage,
                createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
              } : undefined,
            } as StudyRoom;
          });
          rooms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          callback(rooms);
        });
      }
    });
  } catch (error) {
    console.error('Erro ao configurar listener de salas:', error);
    return () => {};
  }
};


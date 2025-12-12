import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification } from '../types';

export const createNotification = async (
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'message' | 'praying',
  fromUserId: string,
  fromUserName: string,
  fromUserPhotoURL: string | undefined,
  oracaoId?: string,
  chatId?: string
): Promise<string> => {
  const notificationData = {
    userId,
    type,
    fromUserId,
    fromUserName,
    fromUserPhotoURL: fromUserPhotoURL || null,
    oracaoId: oracaoId || null,
    chatId: chatId || null,
    read: false,
    createdAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, 'notifications'), notificationData);
  return docRef.id;
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        // Suporte para notificações admin
        title: data.title,
        message: data.message,
      } as Notification;
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const querySnapshot = await getDocs(q);
  const updates = querySnapshot.docs.map(doc => 
    updateDoc(doc.ref, { read: true })
  );
  await Promise.all(updates);
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return 0;
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        // Suporte para notificações admin
        title: data.title,
        message: data.message,
      } as Notification;
    });
    callback(notifications);
  }, (error) => {
    console.error('Erro ao escutar notificações:', error);
    // Fallback: buscar sem orderBy se houver erro de índice
    if (error.code === 'failed-precondition') {
      const qWithoutOrder = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      return onSnapshot(qWithoutOrder, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            title: data.title,
            message: data.message,
          } as Notification;
        });
        // Ordenar manualmente
        notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(notifications);
      });
    }
  });
};


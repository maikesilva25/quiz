import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createChat, sendMessage } from './chatService';

export type SupportType = 'melhoria' | 'bug' | 'reclamacao' | 'sugestao' | 'outro';
export type SupportStatus = 'aberto' | 'respondido' | 'fechado';

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: SupportType;
  subject: string;
  message: string;
  status: SupportStatus;
  adminReply?: string;
  createdAt: Date;
  updatedAt?: Date;
  answeredAt?: Date;
}

const COLLECTION = 'supportMessages';

export const sendSupportMessage = async (params: {
  userId: string;
  userName: string;
  userEmail: string;
  type: SupportType;
  subject: string;
  message: string;
}) => {
  await addDoc(collection(db, COLLECTION), {
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    type: params.type,
    subject: params.subject,
    message: params.message,
    status: 'aberto',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Também cria um chat de suporte para conversa em tempo real com administradores
  try {
    const adminsSnap = await getDocs(
      query(collection(db, 'users'), where('isAdmin', '==', true))
    );

    const adminIds = adminsSnap.docs.map((d) => d.id);
    if (adminIds.length === 0) {
      return;
    }

    const participants = Array.from(new Set([params.userId, ...adminIds]));
    const isGroup = adminIds.length > 1;

    const chatId = await createChat(
      participants,
      isGroup ? 'group' : 'individual',
      isGroup ? 'Suporte' : undefined,
      params.userId
    );

    const prefix =
      params.type === 'melhoria'
        ? '[Melhoria]'
        : params.type === 'bug'
        ? '[Bug]'
        : params.type === 'reclamacao'
        ? '[Reclamação]'
        : params.type === 'sugestao'
        ? '[Sugestão]'
        : '[Suporte]';

    const firstMessage = `${prefix} ${params.subject}\n\n${params.message}`;
    await sendMessage(chatId, params.userId, params.userName, firstMessage);
  } catch (error) {
    console.error('Erro ao criar chat de suporte:', error);
  }
};

export const getUserSupportMessages = async (userId: string): Promise<SupportMessage[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      type: data.type,
      subject: data.subject,
      message: data.message,
      status: data.status,
      adminReply: data.adminReply,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.(),
      answeredAt: data.answeredAt?.toDate?.(),
    } as SupportMessage;
  });
};

export const updateSupportStatus = async (id: string, status: SupportStatus, adminReply?: string) => {
  const ref = doc(db, COLLECTION, id);
  const payload: any = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (adminReply !== undefined) {
    payload.adminReply = adminReply;
    if (status === 'respondido') {
      payload.answeredAt = serverTimestamp();
    }
  }
  await updateDoc(ref, payload);
};



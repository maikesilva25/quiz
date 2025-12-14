// Tags de oração disponíveis
export type OracaoTag = 
  | 'Gratidão'
  | 'Pedido'
  | 'Louvor'
  | 'Adoração'
  | 'Intercessão'
  | 'Ação de Graças'
  | 'Reflexão'
  | 'Testemunho'
  | 'Versículo'
  | 'Motivação';

export const ORACAO_TAGS: OracaoTag[] = [
  'Gratidão',
  'Pedido',
  'Louvor',
  'Adoração',
  'Intercessão',
  'Ação de Graças',
  'Reflexão',
  'Testemunho',
  'Versículo',
  'Motivação',
];

export interface Oracao {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  type: 'text' | 'photo' | 'video';
  content: string;
  videoURL?: string;
  photoURL?: string;
  likes: string[];
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    text: string;
    createdAt: Date;
  }>;
  favorites: string[];
  tags: string[];
  isPedidoOracao: boolean;
  prayingUsers?: string[];
  views: number;
  createdAt: Date;
}

// ... existing code ...

export interface StudyRoom {
  id: string;
  name: string;
  description?: string;
  topic?: string; // Tópico do estudo (ex: "João 3:16", "Oração", etc.)
  createdBy: string;
  createdByName: string;
  participants: string[];
  maxParticipants?: number;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };
}

export interface StudyMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'praying' | 'admin';
  fromUserId?: string;
  fromUserName?: string;
  fromUserPhotoURL?: string;
  oracaoId?: string;
  chatId?: string;
  title?: string; // Para notificações admin
  message?: string; // Para notificações admin
  read: boolean;
  createdAt: Date;
}

// ... existing code ...

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

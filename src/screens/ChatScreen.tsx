import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage, getChat, banUserFromGroup, addParticipantToGroup, removeParticipantFromGroup } from '../services/chatService';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message, Chat } from '../types';
import { getUserData, getAllUsers } from '../services/authService';

interface ChatScreenProps {
  chatId: string;
  onClose: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ chatId, onClose }) => {
  const { colors } = useTheme();
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const [participantsData, setParticipantsData] = useState<{ [key: string]: { name: string; photoURL?: string } }>({});
  const [creatorName, setCreatorName] = useState<string>('');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChat();
    const unsubscribe = subscribeToMessages();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    if (chat) {
      loadParticipantsData();
      if (chat.type === 'group' && chat.createdBy) {
        loadCreatorName();
        // Verificar se o usuário atual é o admin do grupo
        setIsGroupAdmin(chat.createdBy === user?.uid);
      }
    }
  }, [chat, user]);

  const loadChat = async () => {
    try {
      const chatData = await getChat(chatId);
      setChat(chatData);
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
    }
  };

  const loadParticipantsData = async () => {
    if (!chat) return;
    const data: { [key: string]: { name: string; photoURL?: string } } = {};
    
    for (const participantId of chat.participants) {
      if (participantId !== user?.uid) {
        try {
          const userData = await getUserData(participantId);
          if (userData) {
            data[participantId] = {
              name: userData.name,
              photoURL: userData.photoURL,
            };
          }
        } catch (error) {
          console.error('Erro ao carregar dados do participante:', error);
        }
      }
    }
    
    setParticipantsData(data);
  };

  const loadCreatorName = async () => {
    if (!chat?.createdBy) return;
    try {
      const creatorData = await getUserData(chat.createdBy);
      if (creatorData) {
        setCreatorName(creatorData.name);
      }
    } catch (error) {
      console.error('Erro ao carregar nome do criador:', error);
    }
  };

  const subscribeToMessages = () => {
    try {
      // Tenta com orderBy primeiro
      let q;
      try {
        q = query(
          collection(db, 'messages'),
          where('chatId', '==', chatId),
          orderBy('createdAt', 'asc')
        );
      } catch (orderByError: any) {
        // Se falhar por falta de índice, usa sem orderBy
        if (orderByError.code === 'failed-precondition') {
          console.warn('Índice não encontrado, usando query sem orderBy...');
          q = query(
            collection(db, 'messages'),
            where('chatId', '==', chatId)
          );
        } else {
          throw orderByError;
        }
      }
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            chatId: data.chatId || chatId,
            senderId: data.senderId || '',
            senderName: data.senderName,
            text: data.text || '',
            read: data.read || false,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Message);
        });
        // Ordenar por data se não tiver orderBy
        messagesData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        setMessages(messagesData);
        // Scroll para a última mensagem quando novas mensagens chegarem
        setTimeout(() => {
          if (flatListRef.current && messagesData.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }, (error: any) => {
        console.error('Erro ao escutar mensagens:', error);
        // Se for erro de índice, tenta sem orderBy
        if (error.code === 'failed-precondition') {
          try {
            const qWithoutOrder = query(
              collection(db, 'messages'),
              where('chatId', '==', chatId)
            );
            const unsubscribe2 = onSnapshot(qWithoutOrder, (querySnapshot) => {
              const messagesData: Message[] = [];
              querySnapshot.forEach((doc) => {
                const data = doc.data();
                messagesData.push({
                  id: doc.id,
                  chatId: data.chatId || chatId,
                  senderId: data.senderId || '',
                  senderName: data.senderName,
                  text: data.text || '',
                  read: data.read || false,
                  createdAt: data.createdAt?.toDate() || new Date(),
                } as Message);
              });
              messagesData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
              setMessages(messagesData);
            });
            return unsubscribe2;
          } catch (fallbackError) {
            console.error('Erro no fallback:', fallbackError);
            loadMessages();
          }
        } else {
          // Fallback para carregamento único se onSnapshot falhar
          loadMessages();
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener de mensagens:', error);
      // Fallback para carregamento único
      loadMessages();
      return null;
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !user || !userData) return;
    try {
      await sendMessage(chatId, user.uid, userData.name, messageText);
      setMessageText('');
      // Não precisa chamar loadMessages() pois o listener já atualiza automaticamente
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    }
  };

  const getChatTitle = () => {
    if (!chat) return 'Chat';
    if (chat.type === 'group') {
      return chat.name || 'Grupo';
    }
    // Individual chat - mostrar nome do outro participante
    const otherParticipant = chat.participants.find(id => id !== user?.uid);
    if (otherParticipant && participantsData[otherParticipant]) {
      return participantsData[otherParticipant].name;
    }
    return 'Chat';
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{getChatTitle()}</Text>
          {chat?.type === 'group' && creatorName && (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Criado por {creatorName}
            </Text>
          )}
        </View>
        {chat?.type === 'group' && (
          <TouchableOpacity
            onPress={() => setShowParticipantsModal(true)}
            style={styles.groupInfoButton}
          >
            <Ionicons name="people" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        inverted={false}
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }}
        renderItem={({ item }) => {
          const isMyMessage = item.senderId === user?.uid;
          const senderName = item.senderName || (isMyMessage ? userData?.name : 'Usuário');
          
          return (
            <View
              style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
              ]}
            >
              {!isMyMessage && chat?.type === 'group' && (
                <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                  {senderName}
                </Text>
              )}
              <View
                style={[
                  styles.message,
                  isMyMessage ? styles.myMessage : styles.otherMessage,
                  { backgroundColor: isMyMessage ? colors.primary : colors.surface },
                ]}
              >
                <Text style={[styles.messageText, { color: isMyMessage ? '#fff' : colors.text }]}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.surface, 
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 8), // Apenas safe area, o overlay já cobre a barra
      }]}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Digite uma mensagem..."
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de Participantes */}
      {chat?.type === 'group' && (
        <ParticipantsModal
          visible={showParticipantsModal}
          chat={chat}
          participantsData={participantsData}
          isAdmin={isGroupAdmin}
          onClose={() => setShowParticipantsModal(false)}
          onBanUser={async (userId: string) => {
            try {
              await banUserFromGroup(chatId, userId);
              await loadChat();
              Alert.alert('Sucesso', 'Usuário banido do grupo');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível banir o usuário');
            }
          }}
          onAddUser={async (userId: string) => {
            try {
              await addParticipantToGroup(chatId, userId);
              await loadChat();
              Alert.alert('Sucesso', 'Usuário adicionado ao grupo');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível adicionar o usuário');
            }
          }}
          onRemoveUser={async (userId: string) => {
            try {
              await removeParticipantFromGroup(chatId, userId);
              await loadChat();
              Alert.alert('Sucesso', 'Usuário removido do grupo');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o usuário');
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

// Componente Modal de Participantes
interface ParticipantsModalProps {
  visible: boolean;
  chat: Chat;
  participantsData: { [key: string]: { name: string; photoURL?: string } };
  isAdmin: boolean;
  onClose: () => void;
  onBanUser: (userId: string) => Promise<void>;
  onAddUser: (userId: string) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  visible,
  chat,
  participantsData,
  isAdmin,
  onClose,
  onBanUser,
  onAddUser,
  onRemoveUser,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const styles = createStyles(colors);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const allUsers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const filtered = allUsers.filter(
          (u: any) => 
            u.id !== user?.uid &&
            !chat.participants.includes(u.id) &&
            !chat.bannedUsers?.includes(u.id) &&
            u.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      } finally {
        setLoading(false);
      }
    };
    searchUsers();
  }, [searchTerm, chat, user]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Participantes ({chat.participants.length})
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Lista de Participantes */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Membros</Text>
            {chat.participants.map(participantId => {
              const participant = participantsData[participantId];
              const isCurrentUser = participantId === user?.uid;
              const isCreator = participantId === chat.createdBy;
              
              return (
                <View
                  key={participantId}
                  style={[styles.participantItem, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.participantInfo}>
                    <Ionicons
                      name={isCreator ? 'star' : 'person'}
                      size={20}
                      color={isCreator ? '#FFD700' : colors.textSecondary}
                    />
                    <Text style={[styles.participantName, { color: colors.text }]}>
                      {isCurrentUser ? 'Você' : participant?.name || 'Usuário'}
                      {isCreator && ' (Criador)'}
                    </Text>
                  </View>
                  {isAdmin && !isCurrentUser && !isCreator && (
                    <View style={styles.participantActions}>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Remover Usuário',
                            `Deseja remover ${participant?.name || 'este usuário'} do grupo?`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Remover',
                                style: 'destructive',
                                onPress: () => onRemoveUser(participantId),
                              },
                            ]
                          );
                        }}
                        style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                      >
                        <Ionicons name="person-remove" size={18} color={colors.error} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Banir Usuário',
                            `Deseja banir ${participant?.name || 'este usuário'} do grupo?`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Banir',
                                style: 'destructive',
                                onPress: () => onBanUser(participantId),
                              },
                            ]
                          );
                        }}
                        style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                      >
                        <Ionicons name="ban" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Adicionar Usuários (apenas para admin) */}
            {isAdmin && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                  Adicionar Usuário
                </Text>
                <TextInput
                  style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Buscar usuário..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
                {loading && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ margin: 10 }} />
                )}
                {searchResults.map(userItem => (
                  <TouchableOpacity
                    key={userItem.id}
                    style={[styles.userItem, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      Alert.alert(
                        'Adicionar Usuário',
                        `Deseja adicionar ${userItem.name} ao grupo?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Adicionar',
                            onPress: () => {
                              onAddUser(userItem.id);
                              setSearchTerm('');
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.userName, { color: colors.text }]}>{userItem.name}</Text>
                    <Ionicons name="person-add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    headerContent: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 12, marginTop: 2 },
    groupInfoButton: { padding: 4 },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      maxHeight: '80%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalBody: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    participantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    participantInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    participantName: {
      fontSize: 16,
    },
    participantActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
    },
    searchInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    userItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    userName: {
      fontSize: 16,
    },
    messageContainer: { marginVertical: 4, marginHorizontal: 8 },
    myMessageContainer: { alignItems: 'flex-end' },
    otherMessageContainer: { alignItems: 'flex-start' },
    senderName: { fontSize: 12, marginBottom: 4, marginLeft: 8 },
    message: { padding: 12, borderRadius: 12, maxWidth: '80%' },
    myMessage: { alignSelf: 'flex-end' },
    otherMessage: { alignSelf: 'flex-start' },
    messageText: { fontSize: 14 },
    inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 8 },
    input: { flex: 1, borderWidth: 1, borderRadius: 20, padding: 12 },
    sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  });


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getStudyRoom,
  sendStudyMessage,
  getStudyMessages,
  subscribeToStudyMessages,
  leaveStudyRoom,
  joinStudyRoom,
} from '../services/studyService';
import { StudyRoom, StudyMessage } from '../types';
import { getUserData } from '../services/authService';

interface StudyRoomScreenProps {
  roomId: string;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
}

export const StudyRoomScreen: React.FC<StudyRoomScreenProps> = ({
  roomId,
  onClose,
  onUserPress,
}) => {
  const { colors } = useTheme();
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [participantsData, setParticipantsData] = useState<{ [key: string]: { name: string; photoURL?: string } }>({});
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadRoom();
    loadMessages();

    // Escutar mensagens em tempo real
    const unsubscribe = subscribeToStudyMessages(
      roomId,
      (newMessages) => {
        setMessages(newMessages);
        if (flatListRef.current && newMessages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      },
      (error) => {
        console.error('Erro ao escutar mensagens:', error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    if (room) {
      loadParticipantsData();
    }
  }, [room]);

  const loadRoom = async () => {
    try {
      const roomData = await getStudyRoom(roomId);
      setRoom(roomData);
      if (roomData) {
        // Entrar na sala automaticamente se ainda não estiver participando
        if (user && !roomData.participants.includes(user.uid)) {
          try {
            await joinStudyRoom(roomId, user.uid);
            const updatedRoom = await getStudyRoom(roomId);
            setRoom(updatedRoom);
          } catch (error) {
            console.error('Erro ao entrar na sala:', error);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sala:', error);
      Alert.alert('Erro', 'Não foi possível carregar a sala');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getStudyMessages(roomId);
      setMessages(data);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const loadParticipantsData = async () => {
    if (!room) return;
    const data: { [key: string]: { name: string; photoURL?: string } } = {};

    for (const participantId of room.participants) {
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

    setParticipantsData(data);
  };

  const handleSend = async () => {
    if (!messageText.trim() || !user || !userData) return;

    try {
      await sendStudyMessage(roomId, user.uid, userData.name, messageText);
      setMessageText('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    Alert.alert(
      'Sair da Sala',
      'Deseja realmente sair desta sala de estudo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveStudyRoom(roomId, user.uid);
              onClose();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair da sala');
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando sala...
        </Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Sala não encontrada
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {room.name}
          </Text>
          {room.topic && (
            <Text style={[styles.headerSubtitle, { color: colors.primary }]} numberOfLines={1}>
              📌 {room.topic}
            </Text>
          )}
          <View style={styles.headerInfo}>
            <Ionicons name="people" size={14} color={colors.textSecondary} />
            <Text style={[styles.headerInfoText, { color: colors.textSecondary }]}>
              {room.participants.length} participantes
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLeave}>
          <Ionicons name="exit-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      {room.description && (
        <View style={[styles.descriptionContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {room.description}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }}
        renderItem={({ item }) => {
          const isMyMessage = item.senderId === user?.uid;
          const senderName = item.senderName || 'Usuário';

          return (
            <View
              style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
              ]}
            >
              {!isMyMessage && (
                <TouchableOpacity
                  onPress={() => onUserPress?.(item.senderId)}
                  style={styles.senderHeader}
                >
                  <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                    {senderName}
                  </Text>
                </TouchableOpacity>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma mensagem ainda
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Seja o primeiro a compartilhar!
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Compartilhe seus pensamentos sobre a palavra..."
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          disabled={!messageText.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
    },
    errorText: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      textAlign: 'center',
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 20,
    },
    backButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      gap: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    headerSubtitle: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },
    headerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    headerInfoText: {
      fontSize: 12,
    },
    descriptionContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    descriptionText: {
      fontSize: 14,
      lineHeight: 20,
    },
    messageContainer: {
      marginVertical: 4,
      marginHorizontal: 8,
    },
    myMessageContainer: {
      alignItems: 'flex-end',
    },
    otherMessageContainer: {
      alignItems: 'flex-start',
    },
    senderHeader: {
      marginBottom: 4,
      marginLeft: 8,
    },
    senderName: {
      fontSize: 12,
      fontWeight: '600',
    },
    message: {
      padding: 12,
      borderRadius: 12,
      maxWidth: '80%',
    },
    myMessage: {
      alignSelf: 'flex-end',
    },
    otherMessage: {
      alignSelf: 'flex-start',
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      gap: 8,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      padding: 12,
      maxHeight: 100,
      fontSize: 14,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      marginTop: 8,
    },
  });


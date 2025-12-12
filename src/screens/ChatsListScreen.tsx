import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getChats, createChat, createGroupChat, getChat } from '../services/chatService';
import { searchUsers } from '../services/userSearchService';
import { Chat, User } from '../types';
import { getUserData } from '../services/authService';

interface ChatsListScreenProps {
  onChatPress: (chatId: string) => void;
  onUserPress?: (userId: string) => void;
}

export const ChatsListScreen: React.FC<ChatsListScreenProps> = ({ onChatPress, onUserPress }) => {
  const { colors } = useTheme();
  const { user, userData } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chatType, setChatType] = useState<'individual' | 'group'>('individual');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [chatNames, setChatNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      loadChatNames();
    }
  }, [chats]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchUsersList();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadChats = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getChats(user.uid);
      setChats(data);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatNames = async () => {
    if (!user) return;
    const names: { [key: string]: string } = {};
    
    for (const chat of chats) {
      if (chat.type === 'group') {
        names[chat.id] = chat.name || 'Grupo';
      } else {
        const otherParticipant = chat.participants.find(id => id !== user.uid);
        if (otherParticipant) {
          try {
            const participantData = await getUserData(otherParticipant);
            if (participantData) {
              names[chat.id] = participantData.name;
            }
          } catch (error) {
            names[chat.id] = 'Usuário';
          }
        }
      }
    }
    
    setChatNames(names);
  };

  const searchUsersList = async () => {
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results.filter(u => u.id !== user?.uid));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleCreateChat = async () => {
    if (!user || !userData) return;
    
    if (chatType === 'individual') {
      if (selectedUsers.length !== 1) {
        Alert.alert('Erro', 'Selecione um usuário para chat individual');
        return;
      }
      
      try {
        const chatId = await createChat([user.uid, selectedUsers[0]], 'individual');
        setShowCreateModal(false);
        setSelectedUsers([]);
        setSearchTerm('');
        loadChats();
        onChatPress(chatId);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível criar o chat');
      }
    } else {
      // Verificar se o usuário é verificado
      if (!userData.verified) {
        Alert.alert(
          'Acesso Negado',
          'Apenas usuários verificados podem criar grupos. Entre em contato com o administrador para verificar sua conta.'
        );
        return;
      }
      
      if (!groupName.trim()) {
        Alert.alert('Erro', 'Digite um nome para o grupo');
        return;
      }
      
      if (selectedUsers.length < 1) {
        Alert.alert('Erro', 'Selecione pelo menos um participante');
        return;
      }
      
      try {
        const chatId = await createGroupChat(
          [user.uid, ...selectedUsers],
          groupName.trim(),
          user.uid
        );
        setShowCreateModal(false);
        setSelectedUsers([]);
        setGroupName('');
        setSearchTerm('');
        loadChats();
        onChatPress(chatId);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível criar o grupo');
      }
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      if (chatType === 'individual') {
        setSelectedUsers([userId]);
      } else {
        setSelectedUsers([...selectedUsers, userId]);
      }
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.createButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const chatName = chatNames[item.id] || (item.type === 'group' ? item.name : 'Chat');
          return (
            <TouchableOpacity
              style={[styles.chatItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
              onPress={() => onChatPress(item.id)}
            >
              <View style={styles.chatIcon}>
                <Ionicons
                  name={item.type === 'group' ? 'people' : 'person'}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.chatInfo}>
                <Text style={[styles.chatName, { color: colors.text }]}>{chatName}</Text>
                <Text style={[styles.chatText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.lastMessage?.text || 'Nenhuma mensagem'}
                </Text>
              </View>
              {item.unreadCount && item.unreadCount[user?.uid || ''] > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadText}>{item.unreadCount[user?.uid || '']}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum chat ainda</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Toque no + para criar um chat
            </Text>
          </View>
        }
      />

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setSelectedUsers([]);
          setGroupName('');
          setSearchTerm('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {chatType === 'individual' ? 'Novo Chat' : 'Novo Grupo'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setSelectedUsers([]);
                  setGroupName('');
                  setSearchTerm('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  chatType === 'individual' && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setChatType('individual');
                  setSelectedUsers([]);
                }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: chatType === 'individual' ? '#fff' : colors.text },
                  ]}
                >
                  Individual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  chatType === 'group' && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setChatType('group');
                  setSelectedUsers([]);
                }}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: chatType === 'group' ? '#fff' : colors.text },
                  ]}
                >
                  Grupo
                </Text>
              </TouchableOpacity>
            </View>

            {chatType === 'group' && (
              <TextInput
                style={[styles.groupNameInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Nome do grupo"
                placeholderTextColor={colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
              />
            )}

            <TextInput
              style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Buscar usuários..."
              placeholderTextColor={colors.textSecondary}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />

            <ScrollView style={styles.searchResults}>
              {searchResults.map((userItem) => (
                <TouchableOpacity
                  key={userItem.id}
                  style={[
                    styles.userItem,
                    { backgroundColor: colors.surface },
                    selectedUsers.includes(userItem.id) && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => toggleUserSelection(userItem.id)}
                >
                  <Text style={[styles.userName, { color: colors.text }]}>{userItem.name}</Text>
                  {selectedUsers.includes(userItem.id) && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.createChatButton,
                { backgroundColor: colors.primary },
                (chatType === 'group' && !groupName.trim()) || selectedUsers.length === 0
                  ? { opacity: 0.5 }
                  : {},
              ]}
              onPress={handleCreateChat}
              disabled={
                (chatType === 'group' && !groupName.trim()) || selectedUsers.length === 0
              }
            >
              <Text style={styles.createChatButtonText}>Criar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    createButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    chatIcon: {
      marginRight: 12,
    },
    chatInfo: {
      flex: 1,
    },
    chatName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    chatText: { fontSize: 14 },
    unreadBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    unreadText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: { fontSize: 16, marginTop: 16 },
    emptySubtext: { fontSize: 14, marginTop: 8 },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      maxHeight: '80%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 16,
      borderBottomWidth: 1,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    typeSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    typeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    groupNameInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    searchInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    searchResults: {
      maxHeight: 300,
      marginBottom: 16,
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
    createChatButton: {
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    createChatButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });


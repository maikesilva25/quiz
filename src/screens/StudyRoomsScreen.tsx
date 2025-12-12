import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getStudyRooms,
  createStudyRoom,
  joinStudyRoom,
  subscribeToStudyRooms,
} from '../services/studyService';
import { StudyRoom } from '../types';

interface StudyRoomsScreenProps {
  onRoomPress: (roomId: string) => void;
  onUserPress?: (userId: string) => void;
}

export const StudyRoomsScreen: React.FC<StudyRoomsScreenProps> = ({
  onRoomPress,
  onUserPress,
}) => {
  const { colors } = useTheme();
  const { user, userData } = useAuth();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomTopic, setRoomTopic] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('50');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRooms();

    // Escutar novas salas em tempo real
    const unsubscribe = subscribeToStudyRooms((newRooms) => {
      setRooms(newRooms);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await getStudyRooms();
      setRooms(data);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as salas de estudo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!user || !userData) return;

    if (!roomName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a sala');
      return;
    }

    setCreating(true);
    try {
      const roomId = await createStudyRoom(
        roomName.trim(),
        roomDescription.trim(),
        roomTopic.trim(),
        user.uid,
        userData.name,
        true,
        parseInt(maxParticipants) || 50,
        []
      );
      setShowCreateModal(false);
      setRoomName('');
      setRoomDescription('');
      setRoomTopic('');
      setMaxParticipants('50');
      loadRooms();
      onRoomPress(roomId);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a sala');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (room: StudyRoom) => {
    if (!user) return;

    try {
      await joinStudyRoom(room.id, user.uid);
      onRoomPress(room.id);
    } catch (error: any) {
      if (error.message === 'Sala cheia') {
        Alert.alert('Sala Cheia', 'Esta sala atingiu o número máximo de participantes');
      } else {
        Alert.alert('Erro', 'Não foi possível entrar na sala');
      }
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (searchTerm.length < 2) return true;
    const term = searchTerm.toLowerCase();
    return (
      room.name.toLowerCase().includes(term) ||
      room.description?.toLowerCase().includes(term) ||
      room.topic?.toLowerCase().includes(term) ||
      room.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  });

  const styles = createStyles(colors);

  if (loading && rooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando salas...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📖 Estudos Bíblicos</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.createButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar salas..."
          placeholderTextColor={colors.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isParticipating = user && item.participants.includes(user.uid);
          const isFull = item.participants.length >= (item.maxParticipants || 50);

          return (
            <TouchableOpacity
              style={[styles.roomCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                if (isParticipating) {
                  onRoomPress(item.id);
                } else {
                  handleJoinRoom(item);
                }
              }}
            >
              <View style={styles.roomHeader}>
                <View style={[styles.roomIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="book" size={24} color={colors.primary} />
                </View>
                <View style={styles.roomInfo}>
                  <Text style={[styles.roomName, { color: colors.text }]}>{item.name}</Text>
                  {item.topic && (
                    <Text style={[styles.roomTopic, { color: colors.primary }]}>
                      📌 {item.topic}
                    </Text>
                  )}
                </View>
                {isParticipating && (
                  <View style={[styles.participatingBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.participatingText, { color: colors.primary }]}>Participando</Text>
                  </View>
                )}
              </View>

              {item.description && (
                <Text style={[styles.roomDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              <View style={styles.roomFooter}>
                <View style={styles.roomStats}>
                  <Ionicons name="people" size={16} color={colors.textSecondary} />
                  <Text style={[styles.roomStatsText, { color: colors.textSecondary }]}>
                    {item.participants.length}/{item.maxParticipants || 50}
                  </Text>
                  {isFull && (
                    <Text style={[styles.fullText, { color: colors.error }]}> • Cheia</Text>
                  )}
                </View>
                {item.lastMessage && (
                  <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.lastMessage.senderName}: {item.lastMessage.text}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma sala de estudo encontrada
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Crie uma nova sala para começar a estudar!
            </Text>
          </View>
        }
      />

      {/* Modal de Criar Sala */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nova Sala de Estudo</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setRoomName('');
                  setRoomDescription('');
                  setRoomTopic('');
                  setMaxParticipants('50');
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Nome da Sala *</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Ex: Estudo de João 3:16"
                  placeholderTextColor={colors.textSecondary}
                  value={roomName}
                  onChangeText={setRoomName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Tópico/Referência</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Ex: João 3:16, Oração, Fé, etc."
                  placeholderTextColor={colors.textSecondary}
                  value={roomTopic}
                  onChangeText={setRoomTopic}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Descrição</Text>
                <TextInput
                  style={[styles.modalTextArea, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Descreva o que será estudado nesta sala..."
                  placeholderTextColor={colors.textSecondary}
                  value={roomDescription}
                  onChangeText={setRoomDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Máximo de Participantes</Text>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                  placeholder="50"
                  placeholderTextColor={colors.textSecondary}
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.createRoomButton,
                  { backgroundColor: colors.primary },
                  (!roomName.trim() || creating) && { opacity: 0.5 },
                ]}
                onPress={handleCreateRoom}
                disabled={!roomName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.createRoomButtonText}>Criar Sala</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    createButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    listContent: {
      padding: 16,
    },
    roomCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    roomHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 12,
    },
    roomIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    roomInfo: {
      flex: 1,
    },
    roomName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    roomTopic: {
      fontSize: 14,
      fontWeight: '600',
    },
    participatingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    participatingText: {
      fontSize: 12,
      fontWeight: '600',
    },
    roomDescription: {
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    roomFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    roomStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    roomStatsText: {
      fontSize: 14,
      fontWeight: '600',
    },
    fullText: {
      fontSize: 12,
      fontWeight: '600',
    },
    lastMessage: {
      flex: 1,
      fontSize: 12,
      marginLeft: 12,
      textAlign: 'right',
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
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      maxHeight: '90%',
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
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
    },
    modalTextArea: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    createRoomButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
      gap: 8,
    },
    createRoomButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });


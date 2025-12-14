import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoPlayer } from './VideoPlayer';
import { Oracao, ORACAO_TAGS } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  likeOracao,
  unlikeOracao,
  favoriteOracao,
  unfavoriteOracao,
  addComment,
  incrementOracaoView,
  togglePraying,
  updateOracao,
  deleteOracao,
} from '../services/oracaoService';
import { getUniqueImageUrl } from '../utils/imageUtils';

interface OracaoCardProps {
  oracao: Oracao;
  currentUserId: string;
  onUpdate?: () => void;
  onUserPress?: (userId: string) => void;
  isBoosted?: boolean;
}

export const OracaoCard: React.FC<OracaoCardProps> = ({
  oracao,
  currentUserId,
  onUpdate,
  onUserPress,
  isBoosted = false,
}) => {
  const { colors } = useTheme();
  const { userData } = useAuth();
  const [isLiked, setIsLiked] = useState(oracao.likes?.includes(currentUserId) || false);
  const [isFavorited, setIsFavorited] = useState(oracao.favorites?.includes(currentUserId) || false);
  const [isPraying, setIsPraying] = useState(false);
  const [prayingUsersCount, setPrayingUsersCount] = useState(oracao.prayingUsers?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(oracao.content);
  const [editTags, setEditTags] = useState<string[]>(oracao.tags || []);
  const [editIsPedidoOracao, setEditIsPedidoOracao] = useState(oracao.isPedidoOracao || false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (oracao.prayingUsers) {
      setIsPraying(oracao.prayingUsers.includes(currentUserId));
      setPrayingUsersCount(oracao.prayingUsers.length);
    }
  }, [oracao.prayingUsers, currentUserId]);

  useEffect(() => {
    if (oracao.id) {
      incrementOracaoView(oracao.id);
    }
  }, [oracao.id]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikeOracao(oracao.id, currentUserId);
        setIsLiked(false);
      } else {
        await likeOracao(oracao.id, currentUserId);
        setIsLiked(true);
      }
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  const handleFavorite = async () => {
    try {
      if (isFavorited) {
        await unfavoriteOracao(oracao.id, currentUserId);
        setIsFavorited(false);
      } else {
        await favoriteOracao(oracao.id, currentUserId);
        setIsFavorited(true);
      }
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  };

  const handlePraying = async () => {
    try {
      await togglePraying(oracao.id, currentUserId);
      setIsPraying(!isPraying);
      setPrayingUsersCount(prev => isPraying ? prev - 1 : prev + 1);
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao marcar como orando:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!userData) {
      Alert.alert('Erro', 'Você precisa estar logado para comentar');
      return;
    }

    try {
      await addComment(oracao.id, currentUserId, userData.name, userData.photoURL, commentText);
      setCommentText('');
      onUpdate?.();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o comentário');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Oração',
      'Tem certeza que deseja excluir esta oração? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteOracao(oracao.id, currentUserId);
              Alert.alert('Sucesso', 'Oração excluída com sucesso');
              onUpdate?.();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Não foi possível excluir a oração');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = async () => {
    if (!editContent.trim() && oracao.type === 'text') {
      Alert.alert('Erro', 'Digite o conteúdo da oração');
      return;
    }

    setIsEditing(true);
    try {
      await updateOracao(oracao.id, currentUserId, {
        content: editContent,
        tags: editTags,
        isPedidoOracao: editIsPedidoOracao,
      });
      Alert.alert('Sucesso', 'Oração atualizada com sucesso');
      setShowEditModal(false);
      onUpdate?.();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível editar a oração');
    } finally {
      setIsEditing(false);
    }
  };

  const toggleEditTag = (tag: string) => {
    if (editTags.includes(tag)) {
      setEditTags(editTags.filter(t => t !== tag));
    } else {
      setEditTags([...editTags, tag]);
    }
  };

  const getTagEmoji = (tag: string) => {
    const emojiMap: { [key: string]: string } = {
      'Gratidão': '🙏',
      'Pedido': '📿',
      'Intercessão': '🤲',
      'Adoração': '✨',
      'Louvores': '🎵',
      'Família': '👨‍👩‍👧‍👦',
      'Saúde': '💚',
      'Trabalho': '💼',
      'Estudos': '📚',
      'Relacionamentos': '💕',
    };
    return emojiMap[tag] || '🏷️';
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {isBoosted && (
        <View style={[styles.boostBadge, { backgroundColor: colors.accent + '20' }]}>
          <Ionicons name="star" size={16} color={colors.accent} />
          <Text style={[styles.boostBadgeText, { color: colors.accent }]}>Destaque</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress?.(oracao.userId)}
        >
          {oracao.userPhotoURL ? (
            <Image
              source={{ uri: getUniqueImageUrl(oracao.userPhotoURL, oracao.userId) }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
          )}
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{oracao.userName}</Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {oracao.createdAt.toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </TouchableOpacity>
        
        {oracao.userId === currentUserId && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={styles.ownerButton}
              onPress={() => {
                setEditContent(oracao.content);
                setEditTags(oracao.tags || []);
                setEditIsPedidoOracao(oracao.isPedidoOracao || false);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ownerButton}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {oracao.tags && oracao.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {oracao.tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.tagEmoji}>{getTagEmoji(tag)}</Text>
              <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {oracao.isPedidoOracao && (
        <View style={[styles.pedidoBadge, { backgroundColor: colors.accent + '20' }]}>
          <Ionicons name="heart" size={16} color={colors.accent} />
          <Text style={[styles.pedidoText, { color: colors.accent }]}>Pedido de Oração</Text>
        </View>
      )}

      {oracao.type === 'video' && oracao.videoURL && (
        <VideoPlayer uri={oracao.videoURL} style={styles.media} />
      )}

      {oracao.type === 'photo' && oracao.photoURL && (
        <Image
          source={{ uri: getUniqueImageUrl(oracao.photoURL, oracao.userId) }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      <Text style={[styles.content, { color: colors.text }]}>{oracao.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? colors.error : colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {oracao.likes?.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowComments(!showComments)}
        >
          <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {oracao.comments?.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
          <Ionicons
            name={isFavorited ? 'star' : 'star-outline'}
            size={24}
            color={isFavorited ? colors.warning : colors.textSecondary}
          />
        </TouchableOpacity>

        {oracao.isPedidoOracao && (
          <TouchableOpacity style={styles.actionButton} onPress={handlePraying}>
            <Ionicons
              name={isPraying ? 'heart-circle' : 'heart-circle-outline'}
              size={24}
              color={isPraying ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {prayingUsersCount}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentsSection}>
          <ScrollView style={styles.commentsList}>
            {oracao.comments?.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                {comment.userPhotoURL && (
                  <Image
                    source={{ uri: getUniqueImageUrl(comment.userPhotoURL, comment.userId) }}
                    style={styles.commentAvatar}
                  />
                )}
                <View style={styles.commentContent}>
                  <Text style={[styles.commentAuthor, { color: colors.text }]}>
                    {comment.userName}
                  </Text>
                  <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                    {comment.text}
                  </Text>
                  <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                    {comment.createdAt.toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.commentInputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Adicione um comentário..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddComment}
              style={[styles.commentSendButton, { backgroundColor: colors.primary }]}
              disabled={!commentText.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de Edição */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Oração</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Conteúdo da oração..."
                placeholderTextColor={colors.textSecondary}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={oracao.type === 'text'}
              />

              <View style={styles.editTagsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {ORACAO_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tag,
                        editTags.includes(tag) && { backgroundColor: colors.primary + '20' },
                      ]}
                      onPress={() => toggleEditTag(tag)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: editTags.includes(tag) ? colors.primary : colors.text },
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.checkbox, { borderColor: colors.border }]}
                onPress={() => setEditIsPedidoOracao(!editIsPedidoOracao)}
              >
                <Ionicons
                  name={editIsPedidoOracao ? 'checkbox' : 'checkbox-outline'}
                  size={24}
                  color={editIsPedidoOracao ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.checkboxText, { color: colors.text }]}>
                  Marcar como Pedido de Oração
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleEdit}
                disabled={isEditing}
              >
                {isEditing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    boostBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 15,
      zIndex: 1,
    },
    boostBadgeText: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: 'bold',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
    },
    timestamp: {
      fontSize: 12,
      marginTop: 2,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
      gap: 6,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    tagEmoji: {
      fontSize: 12,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
    },
    pedidoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 15,
      marginBottom: 8,
      gap: 6,
    },
    pedidoText: {
      fontSize: 12,
      fontWeight: '600',
    },
    media: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 8,
      marginVertical: 12,
    },
    content: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    commentsSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    commentsList: {
      maxHeight: 200,
      marginBottom: 8,
    },
    comment: {
      flexDirection: 'row',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
    },
    commentContent: {
      flex: 1,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    commentText: {
      fontSize: 14,
      marginBottom: 4,
    },
    commentTime: {
      fontSize: 11,
    },
    commentInputContainer: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      alignItems: 'center',
      gap: 8,
    },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxHeight: 100,
    },
    commentSendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ownerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    ownerButton: {
      padding: 8,
      borderRadius: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 16,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalCloseButton: {
      padding: 4,
    },
    modalBody: {
      maxHeight: 400,
    },
    editInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 120,
      marginBottom: 16,
    },
    editTagsSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    checkbox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 20,
      gap: 12,
    },
    checkboxText: {
      fontSize: 14,
      flex: 1,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });


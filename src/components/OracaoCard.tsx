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
  });


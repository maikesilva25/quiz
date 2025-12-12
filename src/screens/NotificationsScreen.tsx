import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  subscribeToNotifications 
} from '../services/notificationsService';
import { Notification } from '../types';

interface NotificationsScreenProps {
  onClose?: () => void;
  onUserPress?: (userId: string) => void;
  onOracaoPress?: (oracaoId: string) => void;
  onChatPress?: (chatId: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onClose,
  onUserPress,
  onOracaoPress,
  onChatPress,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Escutar novas notificações em tempo real
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Navegar baseado no tipo
    if (notification.type === 'admin') {
      // Notificações admin não têm ação específica
      return;
    }

    if (notification.oracaoId && onOracaoPress) {
      onOracaoPress(notification.oracaoId);
      onClose?.();
    } else if (notification.chatId && onChatPress) {
      onChatPress(notification.chatId);
      onClose?.();
    } else if (notification.fromUserId && onUserPress) {
      onUserPress(notification.fromUserId);
      onClose?.();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.uid);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'heart';
      case 'comment':
        return 'chatbubble';
      case 'follow':
        return 'person-add';
      case 'message':
        return 'mail';
      case 'praying':
        return 'hands';
      case 'admin':
        return 'notifications';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationTitle = (notification: Notification) => {
    if (notification.type === 'admin') {
      return notification.title || 'Notificação do Sistema';
    }
    
    switch (notification.type) {
      case 'like':
        return `${notification.fromUserName} curtiu sua oração`;
      case 'comment':
        return `${notification.fromUserName} comentou em sua oração`;
      case 'follow':
        return `${notification.fromUserName} começou a seguir você`;
      case 'message':
        return `${notification.fromUserName} enviou uma mensagem`;
      case 'praying':
        return `${notification.fromUserName} está orando por você`;
      default:
        return 'Nova notificação';
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    if (notification.type === 'admin') {
      return notification.message || '';
    }
    return '';
  };

  const styles = createStyles(colors);

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notificações</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notificações</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUnread = !item.read;
          return (
            <TouchableOpacity
              style={[
                styles.notificationItem,
                { backgroundColor: colors.surface, borderBottomColor: colors.border },
                isUnread && { backgroundColor: colors.primary + '10' },
              ]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons
                  name={getNotificationIcon(item.type)}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>
                  {getNotificationTitle(item)}
                </Text>
                {item.type === 'admin' && getNotificationMessage(item) && (
                  <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                    {getNotificationMessage(item)}
                  </Text>
                )}
                <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
              {isUnread && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma notificação
            </Text>
          </View>
        }
      />
    </View>
  );
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString('pt-BR');
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    markAllText: {
      fontSize: 14,
      fontWeight: '600',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      marginBottom: 4,
    },
    notificationTime: {
      fontSize: 12,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      marginTop: 16,
    },
  });


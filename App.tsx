import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { RankingScreen } from './src/screens/RankingScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';
import { FavoritosScreen } from './src/screens/FavoritosScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ChatsListScreen } from './src/screens/ChatsListScreen';
import { MaintenanceScreen } from './src/screens/MaintenanceScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { CustomSplashScreen } from './src/screens/SplashScreen';
import { StudyRoomsScreen } from './src/screens/StudyRoomsScreen';
import { StudyRoomScreen } from './src/screens/StudyRoomScreen';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { checkNeedsPasswordChange } from './src/services/authService';
import { subscribeToSettings, getSystemSettings } from './src/services/settingsService';
import type { SystemSettings } from './src/services/settingsService';
import { subscribeToNotifications } from './src/services/notificationsService';
import { Notification } from './src/types';
import { ErrorBoundary } from './src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

type Screen = 
  | 'login' 
  | 'changePassword'
  | 'feed' 
  | 'upload' 
  | 'profile' 
  | 'quiz' 
  | 'shop' 
  | 'ranking'
  | 'userProfile'
  | 'favoritos'
  | 'search'
  | 'chat'
  | 'chatsList'
  | 'studyRooms';

type OverlayScreen = 'userProfile' | 'chat' | 'changePassword' | 'notifications' | 'studyRoom';

const MainApp: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState<Screen>('feed');
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedStudyRoomId, setSelectedStudyRoomId] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [latestAdminNotification, setLatestAdminNotification] = useState<Notification | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Verificar atualizações OTA (apenas em produção)
        if (!__DEV__ && Updates.isEnabled) {
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              // A atualização será aplicada no próximo restart
              console.log('✅ Nova atualização disponível e baixada!');
              console.log('📦 Versão da atualização:', update.manifest?.id || 'N/A');
              // Reiniciar o app para aplicar a atualização
              await Updates.reloadAsync();
            } else {
              console.log('✅ App está atualizado!');
            }
          } catch (updateError) {
            console.warn('Erro ao verificar atualizações:', updateError);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (user && userData) {
      checkNeedsPasswordChange(user.uid).then(needsChange => {
        if (needsChange) {
          setShowChangePassword(true);
        }
      });
    }
  }, [user, userData]);

  useEffect(() => {
    // Verificar configurações do sistema
    getSystemSettings().then(settings => {
      if (settings) {
        setSystemSettings(settings);
        setMaintenanceMode(settings.maintenanceMode || false);
      }
    });

    // Escutar mudanças nas configurações
    const unsubscribe = subscribeToSettings((settings) => {
      if (settings) {
        setSystemSettings(settings);
        setMaintenanceMode(settings.maintenanceMode || false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Escutar notificações em tempo real
    const unsubscribe = subscribeToNotifications(user.uid, (notifications) => {
      const unread = notifications.filter(n => !n.read);
      setUnreadNotifications(unread);
      
      // Verificar se há notificação admin não lida
      const adminNotifications = unread.filter(n => n.type === 'admin');
      if (adminNotifications.length > 0) {
        // Pegar a mais recente
        const latest = adminNotifications.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        )[0];
        setLatestAdminNotification(latest);
        setShowNotificationBanner(true);
      } else {
        setShowNotificationBanner(false);
        setLatestAdminNotification(null);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleLoginSuccess = () => {
    setCurrentScreen('feed');
  };

  const handleUserPress = (userId: string) => {
    setSelectedUserId(userId);
    setOverlayScreen('userProfile');
  };

  const handleChatPress = (chatId: string) => {
    setSelectedChatId(chatId);
    setOverlayScreen('chat');
  };

  const handleCloseOverlay = () => {
    setOverlayScreen(null);
    setSelectedUserId(null);
    setSelectedChatId(null);
    setSelectedStudyRoomId(null);
  };

  const handleStudyRoomPress = (roomId: string) => {
    setSelectedStudyRoomId(roomId);
    setOverlayScreen('studyRoom');
  };

  const handleChangePasswordSuccess = () => {
    setShowChangePassword(false);
  };

  const handleChangePasswordCancel = () => {
    setShowChangePassword(false);
  };

  const styles = createStyles(colors);

  if (!appIsReady || authLoading) {
    return <CustomSplashScreen />;
  }

  // Verificar modo de manutenção (permitir acesso apenas para admins)
  if (maintenanceMode && user && userData && !(userData as any).isAdmin) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <MaintenanceScreen />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  if (showChangePassword) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <ChangePasswordScreen
          onSuccess={handleChangePasswordSuccess}
          onCancel={handleChangePasswordCancel}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" translucent={false} />
      
      {/* Banner de Notificação Admin */}
      {showNotificationBanner && latestAdminNotification && (
        <View style={[styles.notificationBanner, { 
          backgroundColor: colors.primary,
          paddingTop: insets.top + 8,
        }]}>
          <TouchableOpacity
            style={styles.notificationBannerContent}
            onPress={() => {
              setOverlayScreen('notifications');
              setShowNotificationBanner(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
            <View style={styles.notificationBannerText}>
              <Text style={styles.notificationBannerTitle} numberOfLines={1}>
                {latestAdminNotification.title || 'Nova Notificação'}
              </Text>
              {latestAdminNotification.message && (
                <Text style={styles.notificationBannerMessage} numberOfLines={1}>
                  {latestAdminNotification.message}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowNotificationBanner(false)}
              style={styles.closeBannerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Conteúdo Principal */}
      <View style={[styles.content, { paddingTop: showNotificationBanner ? 0 : Math.max(insets.top, 0) }]}>
        {currentScreen === 'feed' && (
          <FeedScreen onUserPress={handleUserPress} />
        )}
        {currentScreen === 'upload' && (
          <ErrorBoundary
            fallback={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Ionicons name="alert-circle" size={48} color={colors.error} />
                <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center', marginTop: 16, marginBottom: 20 }}>
                  Erro ao carregar tela de postagem
                </Text>
                <TouchableOpacity
                  style={[createStyles(colors).navButton, { backgroundColor: colors.primary, padding: 12, borderRadius: 8 }]}
                  onPress={() => setCurrentScreen('feed')}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Voltar ao Feed</Text>
                </TouchableOpacity>
              </View>
            }
          >
            {(() => {
              try {
                return <UploadScreen />;
              } catch (error: any) {
                console.error('Erro ao renderizar UploadScreen:', error);
                return (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>
                      Erro: {error?.message || 'Erro desconhecido'}
                    </Text>
                  </View>
                );
              }
            })()}
          </ErrorBoundary>
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen onUserPress={handleUserPress} />
        )}
        {currentScreen === 'quiz' && (
          <QuizScreen onShowRanking={() => setCurrentScreen('ranking')} />
        )}
        {currentScreen === 'shop' && <ShopScreen />}
        {currentScreen === 'ranking' && (
          <RankingScreen onBack={() => setCurrentScreen('quiz')} />
        )}
        {currentScreen === 'favoritos' && (
          <FavoritosScreen onUserPress={handleUserPress} />
        )}
        {currentScreen === 'search' && (
          <SearchScreen onUserPress={handleUserPress} />
        )}
        {currentScreen === 'chatsList' && (
          <ChatsListScreen onChatPress={handleChatPress} onUserPress={handleUserPress} />
        )}
        {currentScreen === 'studyRooms' && (
          <StudyRoomsScreen onRoomPress={handleStudyRoomPress} onUserPress={handleUserPress} />
        )}
      </View>

      {/* Overlays */}
      {overlayScreen === 'userProfile' && selectedUserId && (
        <View style={[createStyles(colors).overlay, { paddingTop: insets.top }]}>
          <UserProfileScreen
            userId={selectedUserId}
            onClose={handleCloseOverlay}
            onUserPress={handleUserPress}
          />
        </View>
      )}

      {overlayScreen === 'chat' && selectedChatId && (
        <View style={[createStyles(colors).overlay, { 
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 8) + 60, // Esconde a barra de navegação
        }]}>
          <ChatScreen
            chatId={selectedChatId}
            onClose={handleCloseOverlay}
          />
        </View>
      )}

      {overlayScreen === 'notifications' && (
        <View style={[createStyles(colors).overlay, { paddingTop: insets.top }]}>
          <NotificationsScreen
            onClose={handleCloseOverlay}
            onUserPress={handleUserPress}
            onOracaoPress={(oracaoId) => {
              // Navegar para o feed quando clicar em notificação de oração
              setCurrentScreen('feed');
              handleCloseOverlay();
            }}
            onChatPress={handleChatPress}
          />
        </View>
      )}

      {overlayScreen === 'studyRoom' && selectedStudyRoomId && (
        <View style={[createStyles(colors).overlay, { paddingTop: insets.top }]}>
          <StudyRoomScreen
            roomId={selectedStudyRoomId}
            onClose={handleCloseOverlay}
            onUserPress={handleUserPress}
          />
        </View>
      )}

      {/* Navegação Inferior */}
      <View style={[createStyles(colors).bottomNav, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }]}>
        <TouchableOpacity
          style={[createStyles(colors).navButton, currentScreen === 'feed' && createStyles(colors).navButtonActive]}
          onPress={() => setCurrentScreen('feed')}
        >
          <Ionicons
            name={currentScreen === 'feed' ? 'home' : 'home-outline'}
            size={24}
            color={currentScreen === 'feed' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'feed' ? colors.primary : colors.textSecondary },
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[createStyles(colors).navButton, currentScreen === 'search' && createStyles(colors).navButtonActive]}
          onPress={() => setCurrentScreen('search')}
        >
          <Ionicons
            name={currentScreen === 'search' ? 'search' : 'search-outline'}
            size={24}
            color={currentScreen === 'search' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'search' ? colors.primary : colors.textSecondary },
            ]}
          >
            Buscar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[createStyles(colors).navButton, createStyles(colors).navButtonCenter]}
          onPress={() => setCurrentScreen('upload')}
        >
          <View style={[createStyles(colors).centerButton, { backgroundColor: colors.primary }]}>
            <Ionicons
              name="add"
              size={28}
              color="#fff"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[createStyles(colors).navButton, currentScreen === 'quiz' && createStyles(colors).navButtonActive]}
          onPress={() => setCurrentScreen('quiz')}
        >
          <Ionicons
            name={currentScreen === 'quiz' ? 'book' : 'book-outline'}
            size={24}
            color={currentScreen === 'quiz' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'quiz' ? colors.primary : colors.textSecondary },
            ]}
          >
            Quiz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[createStyles(colors).navButton, currentScreen === 'studyRooms' && createStyles(colors).navButtonActive]}
          onPress={() => setCurrentScreen('studyRooms')}
        >
          <Ionicons
            name={currentScreen === 'studyRooms' ? 'library' : 'library-outline'}
            size={24}
            color={currentScreen === 'studyRooms' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'studyRooms' ? colors.primary : colors.textSecondary },
            ]}
          >
            Estudos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[createStyles(colors).navButton, currentScreen === 'chatsList' && createStyles(colors).navButtonActive]}
          onPress={() => setCurrentScreen('chatsList')}
        >
          <Ionicons
            name={currentScreen === 'chatsList' ? 'chatbubbles' : 'chatbubbles-outline'}
            size={24}
            color={currentScreen === 'chatsList' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'chatsList' ? colors.primary : colors.textSecondary },
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[createStyles(colors).navButton, currentScreen === 'profile' && createStyles(colors).navButtonActive]}
          onPress={() => setCurrentScreen('profile')}
        >
          <Ionicons
            name={currentScreen === 'profile' ? 'person' : 'person-outline'}
            size={24}
            color={currentScreen === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'profile' ? colors.primary : colors.textSecondary },
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 1000,
      paddingTop: 0, // Será definido dinamicamente
      paddingBottom: 0, // Será definido dinamicamente
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 4,
      borderTopWidth: 1,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    navButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      borderRadius: 8,
      marginHorizontal: 2,
    },
    navButtonActive: {
      backgroundColor: colors.primary + '15',
    },
    navButtonCenter: {
      flex: 0,
      paddingHorizontal: 8,
    },
    centerButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    navLabel: {
      fontSize: 10,
      marginTop: 4,
      fontWeight: '600',
    },
        loadingText: {
          marginTop: 10,
          fontSize: 16,
        },
        notificationBanner: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        },
        notificationBannerContent: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        },
        notificationBannerText: {
          flex: 1,
        },
        notificationBannerTitle: {
          color: '#fff',
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 2,
        },
        notificationBannerMessage: {
          color: '#fff',
          fontSize: 12,
          opacity: 0.9,
        },
        closeBannerButton: {
          padding: 4,
        },
      });

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

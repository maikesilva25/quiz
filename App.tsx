import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import { StudyRoomsScreen } from './src/screens/StudyRoomsScreen';
import { StudyRoomScreen } from './src/screens/StudyRoomScreen';
import { BibleScreen } from './src/screens/BibleScreen';
import { SupportScreen } from './src/screens/SupportScreen';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { checkNeedsPasswordChange } from './src/services/authService';
import { subscribeToSettings, getSystemSettings } from './src/services/settingsService';
import type { SystemSettings } from './src/services/settingsService';
import { subscribeToNotifications } from './src/services/notificationsService';
import { Notification } from './src/types';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import * as Updates from 'expo-updates';
import { scheduleVerseNotification, requestNotificationPermissions } from './src/services/verseNotificationsService';

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
  | 'studyRooms'
  | 'bible'
  | 'support';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');
  const [updateProgressPercent, setUpdateProgressPercent] = useState<number>(0);

  useEffect(() => {
    async function prepare() {
      try {
        // Verificar atualizações OTA
        console.log('Verificando atualizações OTA...', {
          isEnabled: Updates.isEnabled,
          updateId: Updates.updateId,
          channel: Updates.channel,
        });

        if (Updates.isEnabled) {
          try {
            const update = await Updates.checkForUpdateAsync();
            console.log('Resultado da verificação OTA:', {
              isAvailable: update.isAvailable,
              manifest: update.manifest,
            });

            if (update.isAvailable) {
              // Perguntar ao usuário se deseja atualizar
              Alert.alert(
                'Atualização Disponível',
                'Uma nova versão do app está disponível. Deseja atualizar agora?',
                [
                  {
                    text: 'Depois',
                    style: 'cancel',
                    onPress: () => {
                      console.log('Usuário optou por atualizar depois');
                    },
                  },
                  {
                    text: 'Atualizar Agora',
                    onPress: async () => {
                      // Iniciar atualização
                      setIsUpdating(true);
                      setUpdateProgressPercent(0);
                      setUpdateProgress('Preparando atualização...');

                      // Simular progresso durante verificação
                      for (let i = 0; i <= 20; i++) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        setUpdateProgressPercent(i);
                        setUpdateProgress(`Verificando atualização... ${i}%`);
                      }

                      console.log('Atualização OTA disponível, baixando...');
                      
                      // Simular progresso durante download
                      setUpdateProgress('Baixando atualização...');
                      const downloadPromise = Updates.fetchUpdateAsync();
                      
                      // Simular progresso de 20% a 90%
                      for (let i = 20; i <= 90; i += 5) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        setUpdateProgressPercent(i);
                        setUpdateProgress(`Baixando atualização... ${i}%`);
                      }
                      
                      const fetchResult = await downloadPromise;
                      console.log('Atualização baixada:', {
                        isNew: fetchResult.isNew,
                        manifest: fetchResult.manifest?.id,
                      });
                      
                      // Simular progresso final
                      setUpdateProgress('Aplicando atualização...');
                      for (let i = 90; i <= 100; i += 2) {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        setUpdateProgressPercent(i);
                        setUpdateProgress(`Aplicando atualização... ${i}%`);
                      }
                      
                      console.log('Recarregando app com nova atualização...');
                      
                      // Pequeno delay para mostrar 100%
                      await new Promise(resolve => setTimeout(resolve, 300));
                      
                      // Recarregar o app com a nova atualização
                      await Updates.reloadAsync();
                      // Não continua aqui porque o app será recarregado
                    },
                  },
                ]
              );
              // Continuar normalmente - o app não será bloqueado
            } else {
              console.log('Nenhuma atualização OTA disponível. Versão atual:', Updates.updateId);
            }
          } catch (error) {
            console.warn('Erro ao verificar atualizações OTA:', error);
          }
        } else {
          console.log('Updates não está habilitado. Modo:', __DEV__ ? 'desenvolvimento' : 'produção');
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
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

      // Inicializar notificações de versículos bíblicos
      requestNotificationPermissions().then(hasPermission => {
        if (hasPermission) {
          // Agendar notificação diária às 8h da manhã
          scheduleVerseNotification(8, 0, 'nvi').catch(error => {
            console.error('Erro ao agendar notificação de versículo:', error);
          });
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

  // Tela de loading durante atualização OTA
  if (isUpdating) {
    return (
      <View style={[styles.updateContainer, { backgroundColor: colors.background }]}>
        <View style={styles.updateContent}>
          <View style={styles.updateIconContainer}>
            <Ionicons name="cloud-download" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.updateTitle, { color: colors.text }]}>
            Atualizando o app
          </Text>
          <Text style={[styles.updateProgress, { color: colors.textSecondary }]}>
            {updateProgress || 'Preparando atualização...'}
          </Text>
          
          {/* Barra de Progresso */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: colors.surface }]}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${updateProgressPercent}%`,
                    backgroundColor: colors.primary,
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {updateProgressPercent}%
            </Text>
          </View>
          
          <Text style={[styles.updateSubtext, { color: colors.textSecondary }]}>
            Por favor, não feche o app
          </Text>
        </View>
      </View>
    );
  }

  if (!appIsReady || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
          <ProfileScreen
            onUserPress={handleUserPress}
            onSupportPress={() => setCurrentScreen('support')}
          />
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
        {currentScreen === 'bible' && (
          <BibleScreen />
        )}
        {currentScreen === 'support' && (
          <SupportScreen onBack={() => setCurrentScreen('profile')} />
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
      <View
        style={[
          createStyles(colors).bottomNavWrapper,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={[createStyles(colors).bottomNav, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              createStyles(colors).navButton,
              currentScreen === 'feed' && createStyles(colors).navButtonActive,
            ]}
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
            style={[
              createStyles(colors).navButton,
              currentScreen === 'search' && createStyles(colors).navButtonActive,
            ]}
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

          <View style={createStyles(colors).centerButtonWrapper}>
            <TouchableOpacity
              style={[createStyles(colors).centerButton, { backgroundColor: colors.primary }]}
              onPress={() => setCurrentScreen('upload')}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              createStyles(colors).navButton,
              currentScreen === 'quiz' && createStyles(colors).navButtonActive,
            ]}
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
            style={[
              createStyles(colors).navButton,
              currentScreen === 'studyRooms' && createStyles(colors).navButtonActive,
            ]}
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
            style={[
              createStyles(colors).navButton,
              currentScreen === 'bible' && createStyles(colors).navButtonActive,
            ]}
          onPress={() => setCurrentScreen('bible')}
        >
          <Ionicons
            name={currentScreen === 'bible' ? 'book' : 'book-outline'}
            size={24}
            color={currentScreen === 'bible' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'bible' ? colors.primary : colors.textSecondary },
            ]}
          >
            Bíblia
          </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              createStyles(colors).navButton,
              currentScreen === 'shop' && createStyles(colors).navButtonActive,
            ]}
          onPress={() => setCurrentScreen('shop')}
        >
          <Ionicons
            name={currentScreen === 'shop' ? 'storefront' : 'storefront-outline'}
            size={24}
            color={currentScreen === 'shop' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              createStyles(colors).navLabel,
              { color: currentScreen === 'shop' ? colors.primary : colors.textSecondary },
            ]}
          >
            Loja
          </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              createStyles(colors).navButton,
              currentScreen === 'chatsList' && createStyles(colors).navButtonActive,
            ]}
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
            style={[
              createStyles(colors).navButton,
              currentScreen === 'profile' && createStyles(colors).navButtonActive,
            ]}
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
    bottomNavWrapper: {
      paddingHorizontal: 8,
      paddingTop: 4,
    },
    bottomNav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
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
    centerButtonWrapper: {
      position: 'relative',
      marginHorizontal: 4,
    },
    centerButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      elevation: 6,
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
        updateContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        updateContent: {
          alignItems: 'center',
          maxWidth: 320,
          width: '100%',
        },
        updateIconContainer: {
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        },
        updateTitle: {
          fontSize: 28,
          fontWeight: '700',
          marginBottom: 12,
          textAlign: 'center',
        },
        updateProgress: {
          fontSize: 16,
          marginBottom: 24,
          textAlign: 'center',
          fontWeight: '500',
        },
        progressContainer: {
          width: '100%',
          marginBottom: 16,
        },
        progressBarBackground: {
          width: '100%',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 8,
        },
        progressBarFill: {
          height: '100%',
          borderRadius: 4,
        },
        progressPercent: {
          fontSize: 18,
          fontWeight: '700',
          textAlign: 'center',
        },
        updateSubtext: {
          fontSize: 14,
          marginTop: 8,
          textAlign: 'center',
          opacity: 0.7,
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

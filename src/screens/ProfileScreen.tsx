import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { logoutUser, uploadProfilePhoto, updateUserProfile } from '../services/authService';
import { getUniqueImageUrl } from '../utils/imageUtils';
import { searchOracoesByUser } from '../services/searchService';
import { getFollowers, getFollowing } from '../services/followService';
import { getUserStats } from '../services/statsService';
import { Oracao } from '../types';
import { OracaoCard } from '../components/OracaoCard';
import { ProfileFrame } from '../components/ProfileFrame';
import { getShopItem } from '../services/shopService';
import { getUserPurchasedItems, applyFrame, removeFrame } from '../services/userItemsService';
import { ShopItem } from '../types';
import { getUnreadCount, subscribeToNotifications } from '../services/notificationsService';
import { Notification } from '../types';
import { checkForUpdates, checkOTAUpdate, getOTAUpdateInfo, applyOTAUpdate, downloadUpdate, formatReleaseDate, getCurrentVersion, type AppUpdateInfo } from '../services/updateService';

interface ProfileScreenProps {
  onUserPress?: (userId: string) => void;
  onNotificationsPress?: () => void;
  onSupportPress?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onUserPress, onNotificationsPress, onSupportPress }) => {
  const { user, userData, refreshUserData } = useAuth();
  const { colors } = useTheme();
  const [oracoes, setOracoes] = useState<Oracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeFrame, setActiveFrame] = useState<any>(null);
  const [purchasedItems, setPurchasedItems] = useState<ShopItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserOracoes();
      loadFollowersData();
      loadUserStats();
      loadActiveFrame();
      loadPurchasedItems();
      loadUnreadCount();
      if (!userData && user) {
        refreshUserData();
      }
    }
  }, [user, userData]);

  useEffect(() => {
    if (userData?.bio !== undefined) {
      setBio(userData.bio || '');
    }
  }, [userData?.bio]);

  useEffect(() => {
    if (!user) return;

    // Escutar notificações em tempo real
    const unsubscribe = subscribeToNotifications(user.uid, (notifications) => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const loadUserOracoes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await searchOracoesByUser(user.uid);
      setOracoes(data);
    } catch (error) {
      console.error('Erro ao carregar orações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowersData = async () => {
    if (!user) return;
    try {
      const followers = await getFollowers(user.uid);
      const following = await getFollowing(user.uid);
      setFollowersCount(followers.length);
      setFollowingCount(following.length);
    } catch (error) {
      console.error('Erro ao carregar seguidores:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;
    try {
      setLoadingStats(true);
      const stats = await getUserStats(user.uid);
      setUserStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadActiveFrame = async () => {
    if (!user) return;
    if (!userData?.activeFrame) {
      setActiveFrame(null);
      return;
    }
    try {
      const frame = await getShopItem(userData.activeFrame);
      setActiveFrame(frame);
    } catch (error) {
      console.error('Erro ao carregar frame:', error);
      setActiveFrame(null);
    }
  };

  const loadPurchasedItems = async () => {
    if (!user) return;
    try {
      setLoadingItems(true);
      const items = await getUserPurchasedItems(user.uid);
      setPurchasedItems(items);
    } catch (error) {
      console.error('Erro ao carregar itens comprados:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Erro ao carregar contador de notificações:', error);
    }
  };

  const handlePhotoUpload = async () => {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        await uploadProfilePhoto(user.uid, result.assets[0].uri);
        await refreshUserData();
        Alert.alert('Sucesso', 'Foto atualizada!');
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a foto');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
        },
      },
    ]);
  };

  const handleApplyFrame = async (frameId: string) => {
    if (!user) return;
    try {
      await applyFrame(user.uid, frameId);
      await refreshUserData();
      await loadActiveFrame();
      Alert.alert('Sucesso!', 'Frame aplicado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aplicar o frame');
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;

    try {
      setSavingBio(true);
      await updateUserProfile(user.uid, { bio });
      await refreshUserData();
      Alert.alert('Sucesso', 'Bio atualizada!');
      setEditingBio(false);
    } catch (error) {
      console.error('Erro ao atualizar bio:', error);
      Alert.alert('Erro', 'Não foi possível atualizar sua bio.');
    } finally {
      setSavingBio(false);
    }
  };

  const handleRemoveFrame = async () => {
    if (!user) return;
    try {
      await removeFrame(user.uid);
      await refreshUserData();
      setActiveFrame(null);
      Alert.alert('Sucesso!', 'Frame removido!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o frame');
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      // Verifica informações detalhadas sobre OTA
      const otaInfo = await getOTAUpdateInfo();
      
      console.log('Status OTA:', otaInfo);
      
      if (otaInfo.isAvailable) {
        Alert.alert(
          'Atualização OTA Disponível',
          `Uma nova atualização está disponível.\n\nVersão atual: ${otaInfo.currentlyRunning || 'N/A'}\nNova versão: ${otaInfo.availableUpdate || 'N/A'}\n\nDeseja atualizar agora?`,
          [
            { text: 'Depois', style: 'cancel' },
            {
              text: 'Atualizar Agora',
              onPress: async () => {
                try {
                  setCheckingUpdate(true);
                  const result = await applyOTAUpdate();
                  setCheckingUpdate(false);
                  
                  if (result.success) {
                    Alert.alert('Sucesso', result.message);
                  } else {
                    Alert.alert('Aviso', result.message);
                  }
                } catch (error) {
                  console.error('Erro ao aplicar atualização OTA:', error);
                  setCheckingUpdate(false);
                  Alert.alert('Erro', 'Não foi possível aplicar a atualização.');
                }
              },
            },
          ]
        );
        setCheckingUpdate(false);
        return;
      }

      // Se não houver OTA, mostra informações e verifica atualização manual (APK)
      if (!otaInfo.isEnabled) {
        Alert.alert(
          'Atualizações OTA',
          `OTA não está habilitado.\n\n${otaInfo.error || 'Certifique-se de estar usando um build de produção.'}\n\nVerificando atualizações manuais...`,
          [{ text: 'OK' }]
        );
      }

      // Verifica atualização manual (APK)
      const update = await checkForUpdates();
      if (update) {
        setUpdateInfo(update);
        setShowUpdateModal(true);
      } else {
        const message = otaInfo.isEnabled
          ? `Você está usando a versão mais recente (${getCurrentVersion()}).\n\nVersão OTA atual: ${otaInfo.currentlyRunning || 'N/A'}`
          : `Você está usando a versão mais recente (${getCurrentVersion()}).`;
        
        Alert.alert('Atualização', message, [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      Alert.alert('Erro', 'Não foi possível verificar atualizações. Tente novamente mais tarde.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleForceOTAUpdate = async () => {
    setCheckingUpdate(true);
    try {
      Alert.alert(
        'Atualização Manual',
        'Deseja forçar a verificação e atualização OTA agora?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setCheckingUpdate(false) },
          {
            text: 'Atualizar',
            onPress: async () => {
              try {
                const result = await applyOTAUpdate();
                setCheckingUpdate(false);
                
                if (result.success) {
                  Alert.alert('Sucesso', result.message);
                } else {
                  Alert.alert('Aviso', result.message);
                }
              } catch (error) {
                console.error('Erro ao aplicar atualização OTA:', error);
                setCheckingUpdate(false);
                Alert.alert('Erro', 'Não foi possível aplicar a atualização.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao forçar atualização OTA:', error);
      setCheckingUpdate(false);
      Alert.alert('Erro', 'Não foi possível verificar atualizações.');
    }
  };

  const handleDownloadUpdate = async () => {
    if (!updateInfo) return;
    try {
      await downloadUpdate(updateInfo.downloadUrl);
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Erro ao baixar atualização:', error);
    }
  };

  const styles = createStyles(colors);

  if (!user || !userData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        {onNotificationsPress && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={styles.notificationsButton}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
      </View>
      <View style={styles.profileContent}>
        <TouchableOpacity onPress={handlePhotoUpload} disabled={uploadingPhoto}>
          <ProfileFrame frameItem={activeFrame} size={100}>
            {userData.photoURL ? (
              <Image
                source={{ uri: getUniqueImageUrl(userData.photoURL, user.uid) }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
          </ProfileFrame>
        </TouchableOpacity>
        {uploadingPhoto && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.uploadIndicator} />
        )}

        <Text style={[styles.name, { color: colors.text }]}>{userData.name}</Text>
        {userData.verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.verifiedText, { color: colors.primary }]}>Verificado</Text>
          </View>
        )}

        <View style={styles.coinsContainer}>
          <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
          <Text style={[styles.coinsText, { color: colors.primary }]}>
            {userData.coins || 0} Moedas
          </Text>
        </View>

        {userData.titles && userData.titles.length > 0 && (
          <View style={styles.titlesContainer}>
            {userData.titles.map((title: string, index: number) => (
              <View key={index} style={[styles.titleBadge, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="trophy" size={14} color={colors.accent} />
                <Text style={[styles.titleText, { color: colors.accent }]}>{title}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bioContainer}>
          <View style={styles.bioHeader}>
            <Text style={[styles.bioLabel, { color: colors.textSecondary }]}>Bio</Text>
            <TouchableOpacity onPress={() => setEditingBio(!editingBio)}>
              <Text style={[styles.bioEditText, { color: colors.primary }]}>
                {editingBio ? 'Cancelar' : bio ? 'Editar' : 'Adicionar'}
              </Text>
            </TouchableOpacity>
          </View>
          {editingBio ? (
            <View>
              <TextInput
                style={[styles.bioInput, { borderColor: colors.border, color: colors.text }]}
                multiline
                placeholder="Fale um pouco sobre você..."
                placeholderTextColor={colors.textSecondary}
                value={bio}
                onChangeText={setBio}
              />
              <TouchableOpacity
                style={[styles.bioSaveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveBio}
                disabled={savingBio}
              >
                {savingBio ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.bioSaveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.bioText, { color: colors.textSecondary }]}>
              {bio || 'Adicione uma bio para o seu perfil.'}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{oracoes.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orações</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{followersCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Seguindo</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 Meus Itens</Text>
            <TouchableOpacity
              onPress={() => setShowItemsModal(true)}
              style={styles.manageButton}
            >
              <Text style={[styles.manageButtonText, { color: colors.primary }]}>Gerenciar</Text>
            </TouchableOpacity>
          </View>
          
          {loadingItems ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : purchasedItems.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você ainda não comprou nenhum item
            </Text>
          ) : (
            <View style={styles.itemsPreview}>
              {purchasedItems.slice(0, 3).map((item) => (
                <View key={item.id} style={[styles.itemPreviewCard, { backgroundColor: colors.surface }]}>
                  <Text style={styles.itemPreviewIcon}>{item.icon || '🎁'}</Text>
                  <Text style={[styles.itemPreviewName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              ))}
              {purchasedItems.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowItemsModal(true)}
                  style={[styles.moreItemsButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.moreItemsText}>+{purchasedItems.length - 3}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {userStats && (
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="heart" size={24} color={colors.error} />
                <Text style={[styles.statCardNumber, { color: colors.text }]}>
                  {userStats.totalLikes}
                </Text>
                <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Curtidas</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="chatbubble" size={24} color={colors.primary} />
                <Text style={[styles.statCardNumber, { color: colors.text }]}>
                  {userStats.totalComentarios}
                </Text>
                <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Comentários</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="eye" size={24} color={colors.accent} />
                <Text style={[styles.statCardNumber, { color: colors.text }]}>
                  {userStats.totalViews}
                </Text>
                <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Visualizações</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Orações</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : oracoes.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você ainda não publicou nenhuma oração
            </Text>
          ) : (
            oracoes.map((oracao) => (
              <OracaoCard
                key={oracao.id}
                oracao={oracao}
                currentUserId={user.uid}
                onUpdate={loadUserOracoes}
                onUserPress={onUserPress}
              />
            ))
          )}
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ Configurações</Text>
          
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleCheckForUpdates}
            disabled={checkingUpdate}
          >
            <View style={styles.settingsButtonContent}>
              <Ionicons name="refresh-outline" size={24} color={colors.primary} />
              <View style={styles.settingsButtonText}>
                <Text style={[styles.settingsButtonTitle, { color: colors.text }]}>
                  Buscar Atualizações
                </Text>
                <Text style={[styles.settingsButtonSubtitle, { color: colors.textSecondary }]}>
                  Versão: {getCurrentVersion()} • Toque para verificar
                </Text>
              </View>
            </View>
            {checkingUpdate ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            onPress={handleForceOTAUpdate}
            disabled={checkingUpdate}
          >
            <View style={styles.settingsButtonContent}>
              <Ionicons name="download-outline" size={24} color={colors.primary} />
              <View style={styles.settingsButtonText}>
                <Text style={[styles.settingsButtonTitle, { color: colors.primary }]}>
                  Atualizar Agora (OTA)
                </Text>
                <Text style={[styles.settingsButtonSubtitle, { color: colors.textSecondary }]}>
                  Força verificação e aplica atualização OTA
                </Text>
              </View>
            </View>
            {checkingUpdate ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="arrow-forward-circle" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onSupportPress}
          >
            <View style={styles.settingsButtonContent}>
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
              <View style={styles.settingsButtonText}>
                <Text style={[styles.settingsButtonTitle, { color: colors.text }]}>
                  Suporte / Fale com o Admin
                </Text>
                <Text style={[styles.settingsButtonSubtitle, { color: colors.textSecondary }]}>
                  Envie sugestões, bugs ou reclamações
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>


      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Sair</Text>
      </TouchableOpacity>

      {/* Modal de Gerenciamento de Itens */}
      <Modal
        visible={showItemsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowItemsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Meus Itens</Text>
              <TouchableOpacity onPress={() => setShowItemsModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {purchasedItems.length === 0 ? (
                <View style={styles.emptyModalContainer}>
                  <Ionicons name="storefront-outline" size={60} color={colors.textSecondary} />
                  <Text style={[styles.emptyModalText, { color: colors.text }]}>
                    Você ainda não possui nenhum item.
                  </Text>
                </View>
              ) : (
                <>
                  {purchasedItems.filter(i => i.type === 'frame').length > 0 && (
                    <View style={styles.itemsCategory}>
                      <View style={styles.categoryHeader}>
                        <Text style={[styles.categoryTitle, { color: colors.text }]}>🖼️ Frames</Text>
                        {userData?.activeFrame && (
                          <TouchableOpacity onPress={handleRemoveFrame} style={styles.removeButton}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                            <Text style={[styles.removeButtonText, { color: colors.error }]}>Remover</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {purchasedItems
                        .filter(i => i.type === 'frame')
                        .map((item) => {
                          const isActive = userData?.activeFrame === item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[
                                styles.itemCard,
                                { backgroundColor: colors.background },
                                isActive && { borderColor: colors.primary, borderWidth: 2 },
                              ]}
                              onPress={() => handleApplyFrame(item.id)}
                            >
                              <Text style={styles.itemCardIcon}>{item.icon || '🖼️'}</Text>
                              <View style={styles.itemCardInfo}>
                                <Text style={[styles.itemCardName, { color: colors.text }]}>
                                  {item.name}
                                </Text>
                                <Text style={[styles.itemCardDescription, { color: colors.textSecondary }]}>
                                  {item.description}
                                </Text>
                              </View>
                              {isActive ? (
                                <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                  <Text style={styles.activeBadgeText}>Ativo</Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                                  onPress={() => handleApplyFrame(item.id)}
                                >
                                  <Text style={styles.applyButtonText}>Aplicar</Text>
                                </TouchableOpacity>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  )}
                </>
              )}
          </ScrollView>
        </View>
      </View>
    </Modal>

      {/* Modal de Atualização */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.updateHeaderContent}>
                <Ionicons name="cloud-download-outline" size={28} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text, marginLeft: 12 }]}>
                  Atualização Disponível
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {updateInfo && (
                <View style={styles.updateContent}>
                  <View style={[styles.updateVersionCard, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.updateVersionLabel, { color: colors.textSecondary }]}>
                      Versão Atual
                    </Text>
                    <Text style={[styles.updateVersionText, { color: colors.text }]}>
                      {getCurrentVersion()}
                    </Text>
                  </View>
                  
                  <View style={styles.updateArrow}>
                    <Ionicons name="arrow-down" size={24} color={colors.primary} />
                  </View>

                  <View style={[styles.updateVersionCard, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.updateVersionLabel, { color: colors.textSecondary }]}>
                      Nova Versão
                    </Text>
                    <Text style={[styles.updateVersionText, { color: colors.primary, fontWeight: 'bold' }]}>
                      {updateInfo.version}
                    </Text>
                  </View>

                  {updateInfo.releaseDate && (
                    <View style={styles.updateDateContainer}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.updateDateText, { color: colors.textSecondary }]}>
                        Lançada em {formatReleaseDate(updateInfo.releaseDate)}
                      </Text>
                    </View>
                  )}

                  {updateInfo.releaseNotes && (
                    <View style={styles.updateNotesContainer}>
                      <Text style={[styles.updateNotesTitle, { color: colors.text }]}>
                        O que há de novo:
                      </Text>
                      <Text style={[styles.updateNotesText, { color: colors.textSecondary }]}>
                        {updateInfo.releaseNotes}
                      </Text>
                    </View>
                  )}

                  {updateInfo.mandatory && (
                    <View style={[styles.mandatoryBadge, { backgroundColor: colors.error + '20' }]}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={[styles.mandatoryText, { color: colors.error }]}>
                        Atualização obrigatória
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                    onPress={handleDownloadUpdate}
                  >
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>Baixar Atualização</Text>
                  </TouchableOpacity>

                  {!updateInfo.mandatory && (
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: colors.border }]}
                      onPress={() => setShowUpdateModal(false)}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                        Depois
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.surface,
    },
    notificationsButton: {
      position: 'relative',
      padding: 8,
    },
    unreadBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    unreadBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadIndicator: {
      marginTop: 8,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 12,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 8,
      gap: 6,
    },
    verifiedText: {
      fontSize: 12,
      fontWeight: '600',
    },
    coinsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
    },
    coinsText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    titlesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 12,
      gap: 8,
    },
    titleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    titleText: {
      fontSize: 12,
      fontWeight: '600',
    },
    bioContainer: {
      width: '100%',
      marginTop: 16,
      paddingHorizontal: 16,
    },
    bioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    bioLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    bioEditText: {
      fontSize: 12,
      fontWeight: '600',
    },
    bioText: {
      fontSize: 14,
      lineHeight: 20,
    },
    bioInput: {
      minHeight: 60,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      textAlignVertical: 'top',
      marginBottom: 8,
      backgroundColor: colors.background,
    },
    bioSaveButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    bioSaveButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
      marginTop: 4,
    },
    content: {
      padding: 16,
    },
    statsSection: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    manageButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
    },
    manageButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    itemsPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    itemPreviewCard: {
      width: 80,
      height: 80,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemPreviewIcon: {
      fontSize: 30,
      marginBottom: 4,
    },
    itemPreviewName: {
      fontSize: 10,
      textAlign: 'center',
    },
    moreItemsButton: {
      width: 80,
      height: 80,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moreItemsText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '30%',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    statCardNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 8,
    },
    statCardLabel: {
      fontSize: 12,
      marginTop: 4,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      margin: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error,
      gap: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      width: '100%',
      height: '80%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalBody: {
      padding: 20,
    },
    emptyModalContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyModalText: {
      fontSize: 16,
      marginTop: 16,
      textAlign: 'center',
    },
    itemsCategory: {
      marginBottom: 24,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.error,
    },
    removeButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    itemCardIcon: {
      fontSize: 30,
    },
    itemCardInfo: {
      flex: 1,
    },
    itemCardName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    itemCardDescription: {
      fontSize: 12,
      marginTop: 4,
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    activeBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    applyButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    applyButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
    },
    settingsButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingsButtonText: {
      marginLeft: 12,
      flex: 1,
    },
    settingsButtonTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    settingsButtonSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    updateHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    updateContent: {
      paddingVertical: 20,
    },
    updateVersionCard: {
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    updateVersionLabel: {
      fontSize: 12,
      marginBottom: 8,
    },
    updateVersionText: {
      fontSize: 24,
      fontWeight: '600',
    },
    updateArrow: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    updateDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      gap: 6,
    },
    updateDateText: {
      fontSize: 12,
    },
    updateNotesContainer: {
      marginTop: 24,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    updateNotesTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    updateNotesText: {
      fontSize: 14,
      lineHeight: 20,
    },
    mandatoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
    },
    mandatoryText: {
      fontSize: 14,
      fontWeight: '600',
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
      gap: 8,
    },
    downloadButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    cancelButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 12,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });


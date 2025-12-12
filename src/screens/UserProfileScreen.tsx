import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserData } from '../services/authService';
import { searchOracoesByUser } from '../services/searchService';
import { followUser, unfollowUser, isFollowing } from '../services/followService';
import { getUniqueImageUrl } from '../utils/imageUtils';
import { Oracao } from '../types';
import { OracaoCard } from '../components/OracaoCard';
import { ProfileFrame } from '../components/ProfileFrame';
import { getShopItem } from '../services/shopService';
import { User } from '../types';

interface UserProfileScreenProps {
  userId: string;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ userId, onClose, onUserPress }) => {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [oracoes, setOracoes] = useState<Oracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeFrame, setActiveFrame] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await getUserData(userId);
      if (userData) {
        setProfileUser(userData as User);
        if (userData.activeFrame) {
          const frame = await getShopItem(userData.activeFrame);
          setActiveFrame(frame);
        }
        const data = await searchOracoesByUser(userId);
        setOracoes(data);
        if (currentUser) {
          const isFollowingUser = await isFollowing(currentUser.uid, userId);
          setFollowing(isFollowingUser);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    try {
      if (following) {
        await unfollowUser(currentUser.uid, userId);
      } else {
        await followUser(currentUser.uid, userId);
      }
      setFollowing(!following);
    } catch (error) {
      console.error('Erro ao seguir/deseguir:', error);
    }
  };

  const styles = createStyles(colors);

  if (loading || !profileUser) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileHeader}>
        <ProfileFrame frameItem={activeFrame} size={100}>
          {profileUser.photoURL ? (
            <Image
              source={{ uri: getUniqueImageUrl(profileUser.photoURL, userId) }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          )}
        </ProfileFrame>
        <Text style={[styles.name, { color: colors.text }]}>{profileUser.name}</Text>
        {profileUser.verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.verifiedText, { color: colors.primary }]}>Verificado</Text>
          </View>
        )}
        {currentUser && currentUser.uid !== userId && (
          <TouchableOpacity
            style={[styles.followButton, { backgroundColor: following ? colors.border : colors.primary }]}
            onPress={handleFollow}
          >
            <Text style={[styles.followButtonText, { color: following ? colors.text : '#fff' }]}>
              {following ? 'Seguindo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.coinsContainer}>
          <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
          <Text style={[styles.coinsText, { color: colors.primary }]}>
            {profileUser.coins || 0} Moedas
          </Text>
        </View>
        {profileUser.titles && profileUser.titles.length > 0 && (
          <View style={styles.titlesContainer}>
            {profileUser.titles.map((title: string, index: number) => (
              <View key={index} style={[styles.titleBadge, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="trophy" size={14} color={colors.accent} />
                <Text style={[styles.titleText, { color: colors.accent }]}>{title}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Orações</Text>
        {oracoes.map((oracao) => (
          <OracaoCard
            key={oracao.id}
            oracao={oracao}
            currentUserId={currentUser?.uid || ''}
            onUpdate={loadProfile}
            onUserPress={onUserPress}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    profileHeader: { alignItems: 'center', padding: 20, backgroundColor: colors.surface },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8, gap: 6 },
    verifiedText: { fontSize: 12, fontWeight: '600' },
    followButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 12 },
    followButtonText: { fontSize: 16, fontWeight: '600' },
    coinsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.primary + '20' },
    coinsText: { fontSize: 18, fontWeight: 'bold' },
    titlesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, gap: 8 },
    titleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    titleText: { fontSize: 12, fontWeight: '600' },
    content: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  });


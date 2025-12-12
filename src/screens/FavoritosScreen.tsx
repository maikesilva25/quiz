import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getFavoritos } from '../services/favoritosService';
import { Oracao } from '../types';
import { OracaoCard } from '../components/OracaoCard';

interface FavoritosScreenProps {
  onUserPress?: (userId: string) => void;
}

export const FavoritosScreen: React.FC<FavoritosScreenProps> = ({ onUserPress }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [oracoes, setOracoes] = useState<Oracao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoritos();
  }, []);

  const loadFavoritos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getFavoritos(user.uid);
      setOracoes(data);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
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
      <FlatList
        data={oracoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OracaoCard
            oracao={item}
            currentUserId={user?.uid || ''}
            onUpdate={loadFavoritos}
            onUserPress={onUserPress}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Nenhum favorito ainda</Text>
          </View>
        }
      />
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 16 },
  });


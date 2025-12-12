import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { OracaoCard } from '../components/OracaoCard';
import { getOracoes } from '../services/oracaoService';
import { getBoostedOracoes } from '../services/shopService';
import { Oracao } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface FeedScreenProps {
  onUserPress?: (userId: string) => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onUserPress }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [oracoes, setOracoes] = useState<Oracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [boostedOracoes, setBoostedOracoes] = useState<Set<string>>(new Set());

  const loadOracoes = useCallback(async () => {
    try {
      const data = await getOracoes();
      const boosts = await getBoostedOracoes();
      const boostedIds = new Set(boosts.map(b => b.oracaoId));
      setBoostedOracoes(boostedIds);
      
      const sorted = data.sort((a, b) => {
        const aBoosted = boostedIds.has(a.id);
        const bBoosted = boostedIds.has(b.id);
        if (aBoosted && !bBoosted) return -1;
        if (!aBoosted && bBoosted) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      setOracoes(sorted);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as orações');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOracoes();
  }, [loadOracoes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOracoes();
  };

  const handleUpdate = () => {
    loadOracoes();
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando orações...</Text>
      </View>
    );
  }

  if (oracoes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Nenhuma oração ainda</Text>
        <Text style={styles.emptySubtext}>
          Seja o primeiro a compartilhar uma oração!
        </Text>
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
            onUpdate={handleUpdate}
            onUserPress={onUserPress}
            isBoosted={boostedOracoes.has(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingVertical: 8,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });


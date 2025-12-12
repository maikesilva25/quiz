import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getQuizRanking } from '../services/quizService';
import { QuizScore } from '../types';
import { getUniqueImageUrl } from '../utils/imageUtils';

interface RankingScreenProps {
  onBack: () => void;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const [ranking, setRanking] = useState<QuizScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const data = await getQuizRanking(50);
      setRanking(data);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ranking</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {ranking.map((score, index) => (
            <View key={score.id} style={[styles.rankItem, { backgroundColor: colors.surface }]}>
              <Text style={[styles.rankNumber, { color: colors.text }]}>{index + 1}º</Text>
              {score.userPhotoURL ? (
                <Image
                  source={{ uri: getUniqueImageUrl(score.userPhotoURL, score.userId) }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name="person" size={20} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{score.userName}</Text>
                <Text style={[styles.userScore, { color: colors.textSecondary }]}>
                  {score.score} pontos • {score.correctAnswers}/{score.totalQuestions} acertos
                </Text>
              </View>
              {index < 3 && (
                <Ionicons
                  name="trophy"
                  size={24}
                  color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    title: { fontSize: 20, fontWeight: 'bold' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { flex: 1, padding: 16 },
    rankItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      gap: 12,
    },
    rankNumber: { fontSize: 18, fontWeight: 'bold', width: 40 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600' },
    userScore: { fontSize: 12, marginTop: 4 },
  });


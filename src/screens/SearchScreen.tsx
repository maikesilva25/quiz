import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { searchOracoes, searchUsers } from '../services/searchService';
import { Oracao, User } from '../types';
import { OracaoCard } from '../components/OracaoCard';

interface SearchScreenProps {
  onUserPress?: (userId: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onUserPress }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [oracoes, setOracoes] = useState<Oracao[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (text.length < 2) {
      setOracoes([]);
      setUsers([]);
      return;
    }
    setSearching(true);
    try {
      const [oraResults, userResults] = await Promise.all([
        searchOracoes(text),
        searchUsers(text),
      ]);
      setOracoes(oraResults);
      setUsers(userResults);
    } catch (error) {
      console.error('Erro ao buscar:', error);
    } finally {
      setSearching(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar..."
          placeholderTextColor={colors.textSecondary}
          value={searchTerm}
          onChangeText={handleSearch}
        />
      </View>
      <FlatList
        data={[...users, ...oracoes]}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => {
          if ('type' in item) {
            return (
              <OracaoCard
                oracao={item as Oracao}
                currentUserId={user?.uid || ''}
                onUserPress={onUserPress}
              />
            );
          } else {
            return (
              <TouchableOpacity
                style={[styles.userItem, { backgroundColor: colors.surface }]}
                onPress={() => onUserPress?.((item as User).id)}
              >
                <Text style={[styles.userName, { color: colors.text }]}>{(item as User).name}</Text>
              </TouchableOpacity>
            );
          }
        }}
        ListEmptyComponent={
          searchTerm.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum resultado</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, margin: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    userItem: { padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
    userName: { fontSize: 16, fontWeight: '600' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 16 },
  });


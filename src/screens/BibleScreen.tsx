import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import {
  getBooks,
  getChapter,
  getVerseOfTheDay,
  searchVerses,
  type BibleChapter,
  type BibleVerse,
} from '../services/bibleService';

export const BibleScreen: React.FC = () => {
  const { colors } = useTheme();
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showVerseOfDay, setShowVerseOfDay] = useState(false);
  const [verseOfDay, setVerseOfDay] = useState<BibleVerse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [version, setVersion] = useState('nvi');
  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);

  const bibleVersions = [
    { code: 'nvi', name: 'Nova Versão Internacional (NVI)' },
    { code: 'acf', name: 'Almeida Corrigida Fiel (ACF)' },
    { code: 'ara', name: 'Almeida Revista e Atualizada (ARA)' },
    { code: 'as21', name: 'Almeida Século 21 (AS21)' },
    { code: 'kjv', name: 'King James Version (KJV)' },
    { code: 'nvt', name: 'Nova Versão Transformadora (NVT)' },
  ];

  useEffect(() => {
    loadBooks();
    loadVerseOfDay();
  }, []);

  useEffect(() => {
    loadVerseOfDay();
  }, [version]);

  useEffect(() => {
    if (selectedBook) {
      loadChapter(selectedBook.abbrev.pt, selectedChapter);
    }
  }, [selectedBook, selectedChapter, version]);

  useEffect(() => {
    loadVerseOfDay();
  }, [version]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = books.filter(book =>
        book.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [searchQuery, books]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getBooks();
      setBooks(data);
      setFilteredBooks(data);
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
      setErrorMessage('Serviço da Bíblia temporariamente indisponível. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (bookAbbrev: string, chapterNum: number) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getChapter(bookAbbrev, chapterNum, version);
      setChapter(data);
    } catch (error) {
      console.error('Erro ao carregar capítulo:', error);
      setErrorMessage('Não foi possível carregar o capítulo. Verifique sua conexão ou tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadVerseOfDay = async () => {
    try {
      setErrorMessage(null);
      const data = await getVerseOfTheDay(version);
      setVerseOfDay(data);
    } catch (error) {
      console.error('Erro ao carregar versículo do dia:', error);
      // Não bloqueia o resto da tela, só não mostra o verso do dia
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const results = await searchVerses(searchQuery, version);
      setSearchResults(results);
      setShowSearch(true);
    } catch (error) {
      console.error('Erro ao buscar versículos:', error);
      setErrorMessage('Não foi possível buscar versículos agora. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: any) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setShowBookSelector(false);
  };

  const handleChapterChange = (delta: number) => {
    if (!selectedBook) return;
    const newChapter = selectedChapter + delta;
    if (newChapter >= 1 && newChapter <= selectedBook.chapters) {
      setSelectedChapter(newChapter);
    }
  };

  const styles = createStyles(colors);

  if (loading && !chapter && !selectedBook) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando Bíblia...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => setShowBookSelector(true)}
          style={styles.headerButton}
        >
          <Ionicons name="book-outline" size={24} color={colors.primary} />
          <Text style={[styles.headerButtonText, { color: colors.text }]}>
            {selectedBook ? selectedBook.name : 'Selecionar Livro'}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowVersionSelector(true)}
            style={[styles.versionButton, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.versionText, { color: colors.primary }]}>
              {bibleVersions.find(v => v.code === version)?.code.toUpperCase() || 'NVI'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowVerseOfDay(true)}
            style={styles.iconButton}
          >
            <Ionicons name="sunny-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSearch(true)}
            style={styles.iconButton}
          >
            <Ionicons name="search-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error ?? '#ff4d4f' }]}>
            {errorMessage}
          </Text>
        </View>
      )}

      {selectedBook && chapter ? (
        <>
          {/* Chapter Navigation */}
          <View style={[styles.chapterNav, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              onPress={() => handleChapterChange(-1)}
              disabled={selectedChapter === 1}
              style={[
                styles.chapterNavButton,
                selectedChapter === 1 && styles.chapterNavButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={selectedChapter === 1 ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>

            <Text style={[styles.chapterTitle, { color: colors.text }]}>
              {selectedBook.name} {selectedChapter}
            </Text>

            <TouchableOpacity
              onPress={() => handleChapterChange(1)}
              disabled={selectedChapter === selectedBook.chapters}
              style={[
                styles.chapterNavButton,
                selectedChapter === selectedBook.chapters && styles.chapterNavButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  selectedChapter === selectedBook.chapters
                    ? colors.textSecondary
                    : colors.primary
                }
              />
            </TouchableOpacity>
          </View>

          {/* Chapter Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.versesContainer}>
              {chapter.chapter.verses.map((verse) => (
                <View key={verse.number} style={styles.verseContainer}>
                  <Text style={[styles.verseNumber, { color: colors.primary }]}>
                    {verse.number}
                  </Text>
                  <Text style={[styles.verseText, { color: colors.text }]}>
                    {verse.text}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Selecione um livro para começar
          </Text>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowBookSelector(true)}
          >
            <Text style={styles.selectButtonText}>Selecionar Livro</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Book Selector Modal */}
      <Modal
        visible={showBookSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Livros da Bíblia</Text>
              <TouchableOpacity onPress={() => setShowBookSelector(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Buscar livro..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredBooks}
              keyExtractor={(item) => item.abbrev.pt}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bookItem, { backgroundColor: colors.surface }]}
                  onPress={() => handleBookSelect(item)}
                >
                  <Text style={[styles.bookName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.bookChapters, { color: colors.textSecondary }]}>
                    {item.chapters} capítulos
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Verse of the Day Modal */}
      <Modal
        visible={showVerseOfDay}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVerseOfDay(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Versículo do Dia</Text>
              <TouchableOpacity onPress={() => setShowVerseOfDay(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {verseOfDay && (
              <ScrollView style={styles.modalBody}>
                <Text style={[styles.verseReference, { color: colors.primary }]}>
                  {verseOfDay.book.name} {verseOfDay.chapter}:{verseOfDay.number}
                </Text>
                <Text style={[styles.verseText, { color: colors.text, fontSize: 18 }]}>
                  {verseOfDay.text}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Buscar Versículos</Text>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Digite sua busca..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.primary }]}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `${item.book.name}-${item.chapter}-${item.number}-${index}`}
              renderItem={({ item }) => (
                <View style={[styles.searchResultItem, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.verseReference, { color: colors.primary }]}>
                    {item.book.name} {item.chapter}:{item.number}
                  </Text>
                  <Text style={[styles.verseText, { color: colors.text }]}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={
                searchQuery ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Nenhum resultado encontrado
                  </Text>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>

      {/* Version Selector Modal */}
      <Modal
        visible={showVersionSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVersionSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Versão da Bíblia</Text>
              <TouchableOpacity onPress={() => setShowVersionSelector(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={bibleVersions}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.versionItem,
                    { backgroundColor: colors.surface },
                    version === item.code && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => {
                    setVersion(item.code);
                    setShowVersionSelector(false);
                    if (selectedBook) {
                      loadChapter(selectedBook.abbrev.pt, selectedChapter);
                    }
                    if (verseOfDay) {
                      loadVerseOfDay();
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.versionItemName,
                      { color: version === item.code ? colors.primary : colors.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {version === item.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
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
    loadingText: {
      marginTop: 12,
      fontSize: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    headerButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      padding: 8,
    },
    versionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 8,
    },
    versionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    chapterNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chapterNavButton: {
      padding: 8,
    },
    chapterNavButtonDisabled: {
      opacity: 0.3,
    },
    chapterTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
    versesContainer: {
      padding: 16,
    },
    verseContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 12,
    },
    verseNumber: {
      fontSize: 14,
      fontWeight: 'bold',
      minWidth: 30,
    },
    verseText: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      marginTop: 16,
      textAlign: 'center',
    },
    errorContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'rgba(255, 77, 79, 0.08)',
    },
    errorText: {
      fontSize: 14,
      textAlign: 'center',
    },
    selectButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 24,
    },
    selectButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
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
    searchInput: {
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
      marginBottom: 12,
    },
    searchContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
    },
    searchButton: {
      padding: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bookName: {
      fontSize: 16,
      fontWeight: '600',
    },
    bookChapters: {
      fontSize: 12,
      marginTop: 4,
    },
    verseReference: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    searchResultItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    versionItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    versionItemName: {
      fontSize: 16,
      fontWeight: '500',
    },
  });


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  sendSupportMessage,
  getUserSupportMessages,
  type SupportMessage,
  type SupportType,
} from '../services/supportService';

interface SupportScreenProps {
  onBack: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { user, userData } = useAuth();
  const [type, setType] = useState<SupportType>('sugestao');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<SupportMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(colors);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const data = await getUserSupportMessages(user.uid);
      setHistory(data);
    } catch (e) {
      console.error('Erro ao carregar histórico de suporte:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!user || !userData) return;

    if (!subject.trim() || !message.trim()) {
      setError('Preencha o assunto e a mensagem.');
      return;
    }

    try {
      setError(null);
      setSending(true);
      await sendSupportMessage({
        userId: user.uid,
        userName: userData.name,
        userEmail: userData.email,
        type,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubject('');
      setMessage('');
      await loadHistory();
    } catch (e) {
      console.error('Erro ao enviar mensagem de suporte:', e);
      setError('Não foi possível enviar sua mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const typeLabel = (t: SupportType) => {
    switch (t) {
      case 'melhoria':
        return 'Melhoria';
      case 'bug':
        return 'Bug';
      case 'reclamacao':
        return 'Reclamação';
      case 'sugestao':
        return 'Sugestão';
      default:
        return 'Outro';
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'respondido') return 'Respondido';
    if (status === 'fechado') return 'Fechado';
    return 'Aberto';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Suporte</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Fale com o Administrador</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Envie sugestões, reporte bugs, reclamações ou melhorias para o app.
          </Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo</Text>
          <View style={styles.typeRow}>
            {(['sugestao', 'melhoria', 'bug', 'reclamacao'] as SupportType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeChip,
                  {
                    borderColor: t === type ? colors.primary : colors.border,
                    backgroundColor: t === type ? colors.primary + '20' : 'transparent',
                  },
                ]}
                onPress={() => setType(t)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: t === type ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {typeLabel(t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Assunto</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Ex: Problema ao abrir a Bíblia"
            placeholderTextColor={colors.textSecondary}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Mensagem</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
            placeholder="Descreva o que aconteceu ou sua sugestão..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />

          {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.sendButtonText}>Enviar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Minhas Mensagens</Text>
            {loadingHistory && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          {history.length === 0 && !loadingHistory ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você ainda não enviou nenhuma mensagem de suporte.
            </Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyHeaderRow}>
                  <Text style={[styles.historySubject, { color: colors.text }]} numberOfLines={1}>
                    {item.subject}
                  </Text>
                  <Text
                    style={[
                      styles.historyStatus,
                      {
                        color:
                          item.status === 'respondido'
                            ? '#2e7d32'
                            : item.status === 'fechado'
                            ? colors.textSecondary
                            : '#FF9500',
                      },
                    ]}
                  >
                    {statusLabel(item.status)}
                  </Text>
                </View>
                <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                  {typeLabel(item.type)} •{' '}
                  {item.createdAt.toLocaleDateString('pt-BR')}{' '}
                  {item.createdAt.toLocaleTimeString('pt-BR')}
                </Text>
                <Text style={[styles.historyMessage, { color: colors.text }]} numberOfLines={3}>
                  {item.message}
                </Text>
                {item.adminReply && (
                  <View style={[styles.replyBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.replyLabel, { color: colors.textSecondary }]}>
                      Resposta do Admin
                    </Text>
                    <Text style={[styles.replyText, { color: colors.text }]}>{item.adminReply}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
    card: {
      borderRadius: 16,
      padding: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
      marginTop: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      marginBottom: 8,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    typeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    typeChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    typeChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    errorText: {
      marginTop: 8,
      fontSize: 13,
    },
    sendButton: {
      marginTop: 12,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    sendButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 13,
      marginTop: 8,
    },
    historyItem: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    historyHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    historySubject: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    historyStatus: {
      fontSize: 12,
      fontWeight: '600',
    },
    historyMeta: {
      fontSize: 11,
      marginBottom: 4,
    },
    historyMessage: {
      fontSize: 13,
      marginBottom: 4,
    },
    replyBox: {
      marginTop: 4,
      padding: 8,
      borderRadius: 8,
    },
    replyLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    replyText: {
      fontSize: 13,
    },
  });




import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getAllRequests, updateRequestStatus } from '../services/accountRequestService';
import { isUserAdmin } from '../services/adminService';
import { createUserByAdmin } from '../services/authService';
import { AccountRequest } from '../types';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AdminScreenProps {
  onClose?: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const { user, userData } = useAuth();
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin && user) {
      loadData();
    }
  }, [isAdmin, user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const admin = await isUserAdmin(user.uid);
      setIsAdmin(admin);
      if (!admin) {
        Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta área');
        onClose?.();
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
    }
  };

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [requestsData, usersData] = await Promise.all([
        getAllRequests(),
        getAllUsers(),
      ]);
      setRequests(requestsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const getAllUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  };

  const handleApproveRequest = async (request: AccountRequest) => {
    if (!user) return;
    
    Alert.alert(
      'Aprovar Solicitação',
      `Deseja aprovar a solicitação de ${request.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            try {
              // Criar senha temporária
              const tempPassword = Math.random().toString(36).slice(-8);
              
              // Criar usuário
              await createUserByAdmin(
                request.email,
                tempPassword,
                request.name,
                request.phoneNumber
              );
              
              // Atualizar status da solicitação
              await updateRequestStatus(request.id, 'approved', user.uid);
              
              Alert.alert(
                'Sucesso',
                `Conta criada! Senha temporária: ${tempPassword}\n\nO usuário precisará trocar a senha no primeiro login.`
              );
              
              loadData();
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao aprovar solicitação');
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (request: AccountRequest) => {
    if (!user) return;
    
    Alert.alert(
      'Rejeitar Solicitação',
      `Deseja rejeitar a solicitação de ${request.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateRequestStatus(request.id, 'rejected', user.uid);
              loadData();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao rejeitar solicitação');
            }
          },
        },
      ]
    );
  };

  const handleToggleUserStatus = async (userId: string, field: 'verified' | 'blocked', currentValue: boolean) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), {
        [field]: !currentValue,
      });
      loadData();
    } catch (error) {
      Alert.alert('Erro', `Erro ao ${field === 'verified' ? 'verificar' : 'bloquear'} usuário`);
    }
  };

  const styles = createStyles(colors);

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Painel Administrativo</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'requests' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'requests' ? colors.primary : colors.textSecondary }]}>
            Solicitações
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'users' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'users' ? colors.primary : colors.textSecondary }]}>
            Usuários
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'requests' && (
          <View>
            {requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhuma solicitação pendente
                </Text>
              </View>
            ) : (
              requests.map((request) => (
                <View
                  key={request.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{request.name}</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>{request.email}</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    Data de Nascimento: {request.dateOfBirth}
                  </Text>
                  {request.phoneNumber && (
                    <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                      WhatsApp: {request.phoneNumber}
                    </Text>
                  )}
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                    Status: {request.status === 'pending' ? 'Pendente' : request.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </Text>
                  {request.status === 'pending' && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleApproveRequest(request)}
                      >
                        <Text style={styles.actionButtonText}>Aprovar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.error }]}
                        onPress={() => handleRejectRequest(request)}
                      >
                        <Text style={styles.actionButtonText}>Rejeitar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View>
            {users.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum usuário encontrado</Text>
              </View>
            ) : (
              users.map((userItem) => (
                <View
                  key={userItem.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{userItem.name || 'Sem nome'}</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>{userItem.email}</Text>
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        { backgroundColor: userItem.verified ? colors.success : colors.border },
                      ]}
                      onPress={() => handleToggleUserStatus(userItem.id, 'verified', userItem.verified || false)}
                    >
                      <Ionicons
                        name={userItem.verified ? 'checkmark-circle' : 'checkmark-circle-outline'}
                        size={20}
                        color={userItem.verified ? '#fff' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.toggleButtonText,
                          { color: userItem.verified ? '#fff' : colors.textSecondary },
                        ]}
                      >
                        {userItem.verified ? 'Verificado' : 'Verificar'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        { backgroundColor: userItem.blocked ? colors.error : colors.border },
                      ]}
                      onPress={() => handleToggleUserStatus(userItem.id, 'blocked', userItem.blocked || false)}
                    >
                      <Ionicons
                        name={userItem.blocked ? 'ban' : 'ban-outline'}
                        size={20}
                        color={userItem.blocked ? '#fff' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.toggleButtonText,
                          { color: userItem.blocked ? '#fff' : colors.textSecondary },
                        ]}
                      >
                        {userItem.blocked ? 'Bloqueado' : 'Bloquear'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      flex: 1,
    },
    headerSpacer: {
      width: 40,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 20,
    },
    card: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    cardText: {
      fontSize: 14,
      marginBottom: 4,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    userActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
    },
  });


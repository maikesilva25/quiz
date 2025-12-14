import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { loginUser } from '../services/authService';
import { createAccountRequest } from '../services/accountRequestService';
import { checkNeedsPasswordChange } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { colors } = useTheme();
  const [mode, setMode] = useState<'login' | 'request'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de pulso no ícone
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotação suave do ícone
    Animated.loop(
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    // Animação ao trocar de modo
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatDate = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      const user = await loginUser(email, password);
      const needsChange = await checkNeedsPasswordChange(user.user.uid);
      if (needsChange) {
        // Navegar para tela de trocar senha
        Alert.alert('Trocar Senha', 'Você precisa trocar sua senha no primeiro login');
      }
      onLoginSuccess();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccount = async () => {
    if (!name || !email || !dateOfBirth) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await createAccountRequest(name, email, dateOfBirth, phoneNumber);
      Alert.alert(
        'Sucesso',
        'Solicitação enviada! Aguarde a aprovação do administrador.'
      );
      setMode('login');
      setName('');
      setEmail('');
      setDateOfBirth('');
      setPhoneNumber('');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao solicitar conta');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                { scale: pulseAnim },
                { rotate: iconRotation },
              ],
            }}
          >
            <View style={[styles.iconContainer, { 
              backgroundColor: colors.primary + '20',
              shadowColor: colors.primary,
            }]}>
              <Ionicons name="heart" size={72} color={colors.primary} />
            </View>
          </Animated.View>
          <Text style={[styles.title, { color: colors.text }]}>Orações</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === 'login' ? 'Faça login para continuar' : 'Solicitar uma conta'}
          </Text>
        </Animated.View>

      <Animated.View
        style={[
          styles.form,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {mode === 'login' ? (
          <>
            <Animated.View 
              style={[
                styles.inputContainer,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.primary,
                },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="mail-outline" size={24} color={colors.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.inputContainer,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.primary,
                },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Senha"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  { 
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={[styles.buttonText, { marginLeft: 12 }]}>Entrando...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.buttonText}>Entrar</Text>
                    <Ionicons name="arrow-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setMode('request')}
                activeOpacity={0.7}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Não tem conta? <Text style={styles.linkTextBold}>Solicitar uma conta</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.View 
              style={[
                styles.inputContainer,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Ionicons name="person-outline" size={22} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nome completo"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.inputContainer,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.inputContainer,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Data de nascimento (DD/MM/AAAA)"
                placeholderTextColor={colors.textSecondary}
                value={dateOfBirth}
                onChangeText={(text) => setDateOfBirth(formatDate(text))}
                maxLength={10}
                keyboardType="numeric"
              />
            </Animated.View>

            <Animated.View 
              style={[
                styles.inputContainer,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Ionicons name="call-outline" size={22} color={colors.primary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="WhatsApp (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.button,
                  { 
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
                onPress={handleRequestAccount}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Enviar Solicitação</Text>
                    <Ionicons name="send" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setMode('login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Já tem conta? <Text style={styles.linkTextBold}>Voltar para login</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      minHeight: '100%',
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    iconContainer: {
      width: 140,
      height: 140,
      borderRadius: 70,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      elevation: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    title: {
      fontSize: 42,
      fontWeight: '800',
      marginTop: 24,
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: 16,
      marginTop: 8,
      opacity: 0.7,
      fontWeight: '500',
    },
    form: {
      width: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderRadius: 20,
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 16,
      elevation: 3,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      minHeight: 64,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      height: 64,
      fontSize: 16,
      fontWeight: '500',
    },
    button: {
      height: 64,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      flexDirection: 'row',
      elevation: 6,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      paddingHorizontal: 32,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 1,
    },
    linkButton: {
      marginTop: 28,
      alignItems: 'center',
      paddingVertical: 12,
    },
    linkText: {
      fontSize: 15,
      fontWeight: '500',
    },
    linkTextBold: {
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });


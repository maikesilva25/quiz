import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export const MaintenanceScreen: React.FC = () => {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Ionicons name="construct" size={80} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text }]}>Em Manutenção</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Estamos realizando melhorias no aplicativo.
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Por favor, tente novamente em alguns instantes.
      </Text>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 12,
    },
    message: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 24,
    },
  });


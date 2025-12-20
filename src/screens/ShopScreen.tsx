import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getShopItems, purchaseItem, getUserPurchases, initializeShopItems } from '../services/shopService';
import { ShopItem, ItemRarity } from '../types';
import { getUserCoins } from '../services/coinsService';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const ShopScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, refreshUserData } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await initializeShopItems();
      const allItems = await getShopItems();
      setItems(allItems);
      const coins = await getUserCoins(user.uid);
      setUserCoins(coins);
      const purchases = await getUserPurchases(user.uid);
      setPurchasedItems(purchases.map(p => p.itemId));
    } catch (error) {
      console.error('Erro ao carregar loja:', error);
      Alert.alert('Erro', 'Não foi possível carregar a loja');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user) return;
    if (userCoins < item.price) {
      Alert.alert('Moedas Insuficientes', `Você precisa de ${item.price} moedas`);
      return;
    }
    Alert.alert('Confirmar Compra', `Comprar "${item.name}" por ${item.price} moedas?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Comprar',
        onPress: async () => {
          try {
            setPurchasing(item.id);
            await purchaseItem(user.uid, item.id);
            Alert.alert('Sucesso!', 'Item comprado!');
            await refreshUserData();
            await loadData();
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao comprar');
          } finally {
            setPurchasing(null);
          }
        },
      },
    ]);
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
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Loja</Text>
        <View style={[styles.coinsDisplay, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
          <Text style={[styles.coinsText, { color: colors.primary }]}>{userCoins}</Text>
        </View>
      </View>
      <ScrollView style={styles.itemsContainer}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Loja vazia
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Os itens serão adicionados em breve
            </Text>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={loadData}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Recarregar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => {
            const isPurchased = purchasedItems.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard, 
                  { backgroundColor: colors.surface },
                  isPurchased && { opacity: 0.6 }
                ]}
                onPress={() => !isPurchased && handlePurchase(item)}
                disabled={isPurchased || purchasing === item.id}
              >
                <Text style={styles.itemIcon}>{item.icon || '🎁'}</Text>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
                <View style={styles.itemFooter}>
                  <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[item.rarity] + '20' }]}>
                    <Text style={[styles.rarityText, { color: RARITY_COLORS[item.rarity] }]}>
                      {item.rarity}
                    </Text>
                  </View>
                  <View style={styles.itemPriceContainer}>
                    <Ionicons name="logo-bitcoin" size={18} color="#FFD700" />
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>{item.price}</Text>
                  </View>
                </View>
                {isPurchased && (
                  <View style={[styles.purchasedBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.purchasedText, { color: colors.primary }]}>Comprado</Text>
                  </View>
                )}
                {purchasing === item.id && (
                  <View style={styles.purchasingOverlay}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    coinsDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 20 },
    coinsText: { fontSize: 18, fontWeight: 'bold' },
    itemsContainer: { flex: 1, padding: 16 },
    itemCard: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    itemIcon: { fontSize: 40, marginBottom: 8 },
    itemName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    itemDescription: { fontSize: 13, marginBottom: 10 },
    itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rarityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 15 },
    rarityText: { fontSize: 12, fontWeight: 'bold' },
    itemPriceContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    itemPrice: { fontSize: 16, fontWeight: 'bold' },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      minHeight: 400,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    refreshButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    purchasedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    purchasedText: {
      fontSize: 12,
      fontWeight: '600',
    },
    purchasingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
    },
  });


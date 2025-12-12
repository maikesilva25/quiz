import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc,
  Timestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShopItem, Purchase, FeedBoost, PowerUp, ItemRarity, ShopItemType } from '../types';
import { removeCoins, addCoins, getUserCoins } from './coinsService';

export const DEFAULT_SHOP_ITEMS: Omit<ShopItem, 'id' | 'createdAt'>[] = [
  { name: 'Frame Básico Azul', description: 'Frame azul simples para seu perfil', type: 'frame', price: 50, rarity: 'common', icon: '🔵', category: 'Perfil', metadata: { frameColor: '#3B82F6', frameStyle: 'solid' } },
  { name: 'Frame Dourado', description: 'Frame dourado elegante', type: 'frame', price: 200, rarity: 'rare', icon: '🟡', category: 'Perfil', metadata: { frameColor: '#FBBF24', frameStyle: 'gradient' } },
  { name: 'Frame Arco-íris', description: 'Frame colorido e vibrante', type: 'frame', price: 300, rarity: 'epic', icon: '🌈', category: 'Perfil', metadata: { frameColor: 'linear-gradient', frameStyle: 'rainbow' } },
  { name: 'Frame Diamante', description: 'Frame exclusivo e brilhante', type: 'frame', price: 500, rarity: 'legendary', icon: '💎', category: 'Perfil', metadata: { frameColor: '#E0E7FF', frameStyle: 'diamond' } },
  { name: 'Mestre do Quiz', description: 'Título exclusivo para mestres', type: 'title', price: 500, rarity: 'epic', icon: '🎓', category: 'Títulos', metadata: { titleText: 'Mestre do Quiz' } },
  { name: 'Estudioso da Bíblia', description: 'Para os amantes das Escrituras', type: 'title', price: 300, rarity: 'rare', icon: '📖', category: 'Títulos', metadata: { titleText: 'Estudioso da Bíblia' } },
  { name: 'Campeão de Fé', description: 'Título para campeões', type: 'title', price: 800, rarity: 'epic', icon: '🏆', category: 'Títulos', metadata: { titleText: 'Campeão de Fé' } },
  { name: 'Sábio das Escrituras', description: 'Título lendário', type: 'title', price: 1000, rarity: 'legendary', icon: '👑', category: 'Títulos', metadata: { titleText: 'Sábio das Escrituras' } },
  { name: 'Destaque 24h', description: 'Seu post no topo por 24 horas', type: 'feed_boost', price: 100, rarity: 'common', icon: '⭐', category: 'Feed', duration: 1 },
  { name: 'Destaque 7 dias', description: 'Seu post no topo por 7 dias', type: 'feed_boost', price: 600, rarity: 'rare', icon: '🌟', category: 'Feed', duration: 7 },
  { name: 'Eliminar Alternativa', description: 'Remove uma alternativa errada', type: 'quiz_power_up', price: 50, rarity: 'common', icon: '❌', category: 'Quiz', metadata: { powerupType: 'eliminate' } },
  { name: 'Tempo Extra', description: '+30 segundos no quiz', type: 'quiz_power_up', price: 100, rarity: 'common', icon: '⏰', category: 'Quiz', metadata: { powerupType: 'time' } },
  { name: 'Dica Especial', description: 'Receba uma dica na questão', type: 'quiz_power_up', price: 150, rarity: 'rare', icon: '💡', category: 'Quiz', metadata: { powerupType: 'hint' } },
  { name: 'Sem Anúncios 7 dias', description: 'Remova anúncios por 7 dias', type: 'ad_removal', price: 300, rarity: 'rare', icon: '🚫', category: 'Premium', duration: 7 },
  { name: 'Sem Anúncios 30 dias', description: 'Remova anúncios por 30 dias', type: 'ad_removal', price: 1000, rarity: 'epic', icon: '✨', category: 'Premium', duration: 30 },
];

export async function initializeShopItems(): Promise<void> {
  try {
    const itemsSnapshot = await getDocs(collection(db, 'shopItems'));
    if (itemsSnapshot.empty) {
      for (const item of DEFAULT_SHOP_ITEMS) {
        await addDoc(collection(db, 'shopItems'), {
          ...item,
          available: true,
          createdAt: Timestamp.now(),
        });
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar itens da loja:', error);
  }
}

export async function getShopItems(category?: string): Promise<ShopItem[]> {
  try {
    let q;
    if (category) {
      q = query(
        collection(db, 'shopItems'),
        where('available', '==', true),
        where('category', '==', category),
        orderBy('price', 'asc')
      );
    } else {
      q = query(
        collection(db, 'shopItems'),
        where('available', '==', true),
        orderBy('category', 'asc'),
        orderBy('price', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as ShopItem;
    });
  } catch (error) {
    console.error('Erro ao obter itens da loja:', error);
    return [];
  }
}

export async function getShopItem(itemId: string): Promise<ShopItem | null> {
  try {
    const docRef = doc(db, 'shopItems', itemId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as ShopItem;
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter item da loja:', error);
    return null;
  }
}

export async function purchaseItem(userId: string, itemId: string): Promise<Purchase> {
  try {
    const item = await getShopItem(itemId);
    if (!item) {
      throw new Error('Item não encontrado');
    }
    
    if (!item.available) {
      throw new Error('Item não disponível');
    }
    
    const userCoins = await getUserCoins(userId);
    if (userCoins < item.price) {
      throw new Error('Moedas insuficientes');
    }
    
    await removeCoins(userId, item.price);
    
    const purchaseRef = await addDoc(collection(db, 'purchases'), {
      userId,
      itemId,
      itemName: item.name,
      itemType: item.type,
      price: item.price,
      purchasedAt: Timestamp.now(),
      used: false,
      expiresAt: item.duration ? Timestamp.fromDate(new Date(Date.now() + item.duration * 24 * 60 * 60 * 1000)) : null,
    });
    
    await applyPurchasedItem(userId, item, purchaseRef.id);
    
    const purchaseData = await getDoc(purchaseRef);
    const data = purchaseData.data();
    return {
      id: purchaseRef.id,
      userId,
      itemId,
      itemName: item.name,
      itemType: item.type,
      price: item.price,
      purchasedAt: data.purchasedAt.toDate(),
      used: data.used || false,
      expiresAt: data.expiresAt?.toDate(),
    } as Purchase;
  } catch (error: any) {
    console.error('Erro ao comprar item:', error);
    throw new Error(error.message || 'Erro ao comprar item');
  }
}

async function applyPurchasedItem(userId: string, item: ShopItem, purchaseId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('Documento do usuário não existe');
      throw new Error('Usuário não encontrado');
    }
    
    const userData = userDoc.data() || {};
    const currentPurchasedItems = userData.purchasedItems || [];
    
    switch (item.type) {
      case 'frame':
        await updateDoc(userRef, {
          activeFrame: item.id,
          purchasedItems: currentPurchasedItems.includes(item.id) 
            ? currentPurchasedItems 
            : [...currentPurchasedItems, item.id],
        });
        console.log('✅ Frame aplicado:', item.id);
        break;
        
      case 'title':
        const titles = [...(userData.titles || [])];
        if (item.metadata?.titleText && !titles.includes(item.metadata.titleText)) {
          titles.push(item.metadata.titleText);
          await updateDoc(userRef, {
            titles,
            purchasedItems: currentPurchasedItems.includes(item.id) 
              ? currentPurchasedItems 
              : [...currentPurchasedItems, item.id],
          });
          console.log('✅ Título aplicado:', item.metadata.titleText);
        }
        break;
        
      case 'ad_removal':
        const adFreeUntil = new Date();
        adFreeUntil.setDate(adFreeUntil.getDate() + (item.duration || 0));
        await updateDoc(userRef, {
          adFreeUntil: Timestamp.fromDate(adFreeUntil),
          purchasedItems: currentPurchasedItems.includes(item.id) 
            ? currentPurchasedItems 
            : [...currentPurchasedItems, item.id],
        });
        console.log('✅ Ad-free aplicado até:', adFreeUntil);
        break;
        
      case 'quiz_power_up':
        await setDoc(doc(db, 'userPowerUps', `${userId}_${purchaseId}`), {
          userId,
          itemId: item.id,
          type: item.metadata?.powerupType,
          uses: item.metadata?.uses || 1,
          used: false,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        });
        await updateDoc(userRef, {
          purchasedItems: currentPurchasedItems.includes(item.id) 
            ? currentPurchasedItems 
            : [...currentPurchasedItems, item.id],
        });
        console.log('✅ Power-up criado:', item.metadata?.powerupType);
        break;
        
      case 'feed_boost':
      case 'post_frame':
      case 'sticker_pack':
        await updateDoc(userRef, {
          purchasedItems: currentPurchasedItems.includes(item.id) 
            ? currentPurchasedItems 
            : [...currentPurchasedItems, item.id],
        });
        console.log('✅ Item comprado (para usar depois):', item.type, item.id);
        break;
        
      default:
        console.warn('⚠️ Tipo de item não reconhecido:', item.type);
    }
  } catch (error) {
    console.error('❌ Erro ao aplicar item comprado:', error);
    throw error;
  }
}

export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  try {
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      orderBy('purchasedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        purchasedAt: data.purchasedAt.toDate(),
        expiresAt: data.expiresAt?.toDate(),
      } as Purchase;
    });
  } catch (error) {
    console.error('Erro ao obter compras:', error);
    return [];
  }
}

export async function getBoostedOracoes(): Promise<FeedBoost[]> {
  try {
    const q = query(collection(db, 'feedBoosts'));
    const querySnapshot = await getDocs(q);
    const now = Timestamp.now().toDate();

    const activeBoosts: FeedBoost[] = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          oracaoId: data.oracaoId,
          userId: data.userId,
          expiresAt: data.expiresAt.toDate(),
          active: data.active,
          createdAt: data.createdAt.toDate(),
        } as FeedBoost;
      })
      .filter(boost => boost.active && boost.expiresAt > now)
      .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime());

    return activeBoosts;
  } catch (error) {
    console.error('Erro ao obter posts em destaque:', error);
    return [];
  }
}

export async function applyFeedBoost(userId: string, oracaoId: string, durationDays: number): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    
    await setDoc(doc(db, 'feedBoosts', `${oracaoId}_${userId}`), {
      oracaoId,
      userId,
      expiresAt: Timestamp.fromDate(expiresAt),
      active: true,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao aplicar destaque:', error);
    throw error;
  }
}

export async function getUserPowerUps(userId: string): Promise<PowerUp[]> {
  try {
    const q = query(
      collection(db, 'userPowerUps'),
      where('userId', '==', userId),
      where('used', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      expiresAt: doc.data().expiresAt?.toDate(),
    })) as PowerUp[];
  } catch (error) {
    console.error('Erro ao obter power-ups:', error);
    return [];
  }
}

export async function usePowerUp(userId: string, powerUpId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'userPowerUps', powerUpId), {
      used: true,
      usedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao usar power-up:', error);
    throw error;
  }
}

export async function giftCoins(fromUserId: string, toUserId: string, amount: number): Promise<void> {
  try {
    const userCoins = await getUserCoins(fromUserId);
    if (userCoins < amount) {
      throw new Error('Moedas insuficientes');
    }
    
    if (amount < 10) {
      throw new Error('Valor mínimo é 10 moedas');
    }
    
    await removeCoins(fromUserId, amount);
    await addCoins(toUserId, amount);
    
    await addDoc(collection(db, 'coinGifts'), {
      fromUserId,
      toUserId,
      amount,
      createdAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Erro ao enviar moedas:', error);
    throw error;
  }
}


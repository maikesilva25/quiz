import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getShopItem, getUserPurchases } from './shopService';
import { ShopItem } from '../types';

export async function getUserPurchasedItems(userId: string): Promise<ShopItem[]> {
  try {
    const purchases = await getUserPurchases(userId);
    const itemsMap = new Map<string, ShopItem>();
    
    for (const purchase of purchases) {
      if (itemsMap.has(purchase.itemId)) {
        continue;
      }
      
      const item = await getShopItem(purchase.itemId);
      if (item) {
        itemsMap.set(purchase.itemId, item);
      }
    }
    
    return Array.from(itemsMap.values());
  } catch (error) {
    console.error('Erro ao obter itens comprados:', error);
    return [];
  }
}

export async function applyFrame(userId: string, frameId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      activeFrame: frameId,
    });
  } catch (error) {
    console.error('Erro ao aplicar frame:', error);
    throw error;
  }
}

export async function removeFrame(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      activeFrame: null,
    });
  } catch (error) {
    console.error('Erro ao remover frame:', error);
    throw error;
  }
}

export async function getActiveFrame(userId: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().activeFrame || null;
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter frame ativo:', error);
    return null;
  }
}

export async function userHasItem(userId: string, itemId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const purchasedItems = userDoc.data().purchasedItems || [];
      return purchasedItems.includes(itemId);
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar item:', error);
    return false;
  }
}


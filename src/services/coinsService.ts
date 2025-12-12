import { doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function addCoins(userId: string, amount: number): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    coins: increment(amount),
  });
}

export async function removeCoins(userId: string, amount: number): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    coins: increment(-amount),
  });
}

export async function getUserCoins(userId: string): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data().coins || 0 : 0;
}

export async function addTitle(userId: string, title: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    titles: arrayUnion(title),
  });
}

export async function removeTitle(userId: string, title: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    titles: arrayRemove(title),
  });
}

export async function getUserTitles(userId: string): Promise<string[]> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data().titles || [] : [];
}


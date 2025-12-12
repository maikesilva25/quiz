import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

export const followUser = async (currentUserId: string, targetUserId: string) => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  await updateDoc(currentUserRef, {
    following: arrayUnion(targetUserId),
  });
  
  await updateDoc(targetUserRef, {
    followers: arrayUnion(currentUserId),
  });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  await updateDoc(currentUserRef, {
    following: arrayRemove(targetUserId),
  });
  
  await updateDoc(targetUserRef, {
    followers: arrayRemove(currentUserId),
  });
};

export const getFollowers = async (userId: string): Promise<string[]> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data().followers || [];
  }
  return [];
};

export const getFollowing = async (userId: string): Promise<string[]> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data().following || [];
  }
  return [];
};

export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  const following = await getFollowing(currentUserId);
  return following.includes(targetUserId);
};


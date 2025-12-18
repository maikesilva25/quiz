import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { User } from '../types';

export interface AuthUser extends User {
  bio?: string;
}

export const getUserData = async (userId: string): Promise<AuthUser | null> => {
  try {
    const currentUser = auth.currentUser;
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userDoc.id,
        name: data.name || currentUser?.displayName || 'Usuário',
        email: data.email || currentUser?.email || '',
        photoURL: data.photoURL || currentUser?.photoURL,
        verified: data.verified || false,
        blocked: data.blocked || false,
        needsPasswordChange: data.needsPasswordChange || false,
        isAdmin: data.isAdmin || false,
        coins: data.coins || 0,
        titles: data.titles || [],
        purchasedItems: data.purchasedItems || [],
        activeFrame: data.activeFrame || undefined,
        activeTheme: data.activeTheme || undefined,
        adFreeUntil: data.adFreeUntil?.toDate() || undefined,
        bio: data.bio || '',
      } as AuthUser;
    }
    
    if (currentUser && currentUser.uid === userId) {
      const userData: AuthUser = {
        id: currentUser.uid,
        name: currentUser.displayName || 'Usuário',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || undefined,
        verified: false,
        blocked: false,
        needsPasswordChange: false,
        isAdmin: false,
        coins: 0,
        titles: [],
        purchasedItems: [],
        activeFrame: undefined,
        activeTheme: undefined,
        adFreeUntil: undefined,
        bio: '',
      };
      
      try {
        await setDoc(doc(db, 'users', userId), {
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL || null,
          verified: userData.verified,
          blocked: userData.blocked,
          needsPasswordChange: userData.needsPasswordChange,
          coins: userData.coins,
          titles: userData.titles,
          purchasedItems: userData.purchasedItems,
          activeFrame: userData.activeFrame ?? null,
          activeTheme: userData.activeTheme ?? null,
          adFreeUntil: userData.adFreeUntil ?? null,
          bio: userData.bio ?? '',
        });
      } catch (error) {
        console.error('Erro ao criar documento do usuário:', error);
      }
      
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      return {
        id: currentUser.uid,
        name: currentUser.displayName || 'Usuário',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || undefined,
        verified: false,
        blocked: false,
        needsPasswordChange: false,
        coins: 0,
        titles: [],
        purchasedItems: [],
        activeFrame: undefined,
        activeTheme: undefined,
        adFreeUntil: undefined,
        bio: '',
      } as AuthUser;
    }
    return null;
  }
};

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const uploadProfilePhoto = async (userId: string, uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const photoRef = ref(storage, `profilePhotos/${userId}/${Date.now()}.jpg`);
  await uploadBytes(photoRef, blob);
  const downloadURL = await getDownloadURL(photoRef);
  
  await updateDoc(doc(db, 'users', userId), {
    photoURL: downloadURL,
  });
  
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      photoURL: downloadURL,
    });
  }
  
  return downloadURL;
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', userId), data);
};

export const createUserByAdmin = async (
  email: string,
  password: string,
  name: string,
  phoneNumber?: string
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    name,
    email,
    verified: false,
    blocked: false,
    needsPasswordChange: true,
    coins: 0,
    titles: [],
    purchasedItems: [],
    activeFrame: null,
    activeTheme: null,
    adFreeUntil: null,
  });
  
  return userCredential.user;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Usuário não autenticado');
  
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
  
  await updateDoc(doc(db, 'users', user.uid), {
    needsPasswordChange: false,
  });
};

export const checkNeedsPasswordChange = async (userId: string): Promise<boolean> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data().needsPasswordChange || false;
  }
  return false;
};


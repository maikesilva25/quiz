import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AccountRequest } from '../types';

export const createAccountRequest = async (
  name: string,
  email: string,
  dateOfBirth: string,
  phoneNumber?: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'accountRequests'), {
      name,
      email,
      dateOfBirth,
      phoneNumber: phoneNumber || null,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar solicitação de conta:', error);
    throw error;
  }
};

export const getPendingRequests = async (): Promise<AccountRequest[]> => {
  try {
    const q = query(collection(db, 'accountRequests'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          processedAt: data.processedAt?.toDate(),
        } as AccountRequest;
      })
      .filter(req => req.status === 'pending');
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
};

export const getAllRequests = async (): Promise<AccountRequest[]> => {
  try {
    const q = query(collection(db, 'accountRequests'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        processedAt: data.processedAt?.toDate(),
      } as AccountRequest;
    });
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
};

export const updateRequestStatus = async (
  requestId: string,
  status: 'approved' | 'rejected',
  processedBy: string
): Promise<void> => {
  await updateDoc(doc(db, 'accountRequests', requestId), {
    status,
    processedAt: Timestamp.now(),
    processedBy,
  });
};


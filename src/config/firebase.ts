import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
// IMPORTANTE: Substitua pelos seus valores reais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFy1mvUKuJvv-UCuf2rNs4LxTqMQmqmFg",
  authDomain: "mk-music-6e2db.firebaseapp.com",
  projectId: "mk-music-6e2db",
  storageBucket: "mk-music-6e2db.firebasestorage.app",
  messagingSenderId: "593810419687",
  appId: "1:593810419687:web:ed369447e3454f83d95742",
  measurementId: "G-2H1L9YFDBJ"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


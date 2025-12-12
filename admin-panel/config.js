// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFy1mvUKuJvv-UCuf2rNs4LxTqMQmqmFg",
  authDomain: "mk-music-6e2db.firebaseapp.com",
  projectId: "mk-music-6e2db",
  storageBucket: "mk-music-6e2db.firebasestorage.app",
  messagingSenderId: "593810419687",
  appId: "1:593810419687:web:ed369447e3454f83d95742",
  measurementId: "G-2H1L9YFDBJ"
};

// Função para inicializar Firebase
function initializeFirebase() {
  if (typeof firebase !== 'undefined' && firebase.apps) {
    try {
      // Verificar se já foi inicializado
      let app;
      if (firebase.apps.length === 0) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app();
      }
      
      // Definir como variáveis globais
      var auth = firebase.auth();
      var db = firebase.firestore();
      
      // Também definir em window para garantir acesso global
      window.auth = auth;
      window.db = db;
      
      console.log('✅ Firebase inicializado com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Firebase:', error);
      return false;
    }
  }
  return false;
}

// Tentar inicializar imediatamente
if (!initializeFirebase()) {
  // Se não funcionou, tentar após um delay
  setTimeout(() => {
    if (!initializeFirebase()) {
      // Tentar novamente após mais um delay
      setTimeout(() => {
        if (!initializeFirebase()) {
          console.error('❌ Firebase SDK não foi carregado após múltiplas tentativas!');
        }
      }, 500);
    }
  }, 100);
}

// Firebase já inicializado em config.js
let currentUser = null;
let currentTab = 'dashboard';

// Função para aguardar Firebase carregar
function waitForFirebase(callback, maxAttempts = 50, attempt = 0) {
  const authInstance = window.auth;
  const dbInstance = window.db;
  
  if (authInstance && dbInstance) {
    callback(authInstance, dbInstance);
  } else if (attempt < maxAttempts) {
    setTimeout(() => waitForFirebase(callback, maxAttempts, attempt + 1), 100);
  } else {
    console.error('Firebase não carregou após múltiplas tentativas!');
    alert('Erro: Firebase não carregou. Verifique o console do navegador e recarregue a página.');
  }
}

// Aguardar o Firebase carregar
window.addEventListener('DOMContentLoaded', () => {
  waitForFirebase((authInstance, dbInstance) => {
    
    // Verificar autenticação
    authInstance.onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        const emailEl = document.getElementById('userEmail');
        if (emailEl) {
          emailEl.textContent = user.email;
        }
        checkAdminStatus();
      } else {
        window.location.href = 'login.html';
      }
    });
    
    // Inicializar tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        currentTab = tab;
        const tabContent = document.getElementById(`${tab}-tab`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
        
        // Scroll para o topo quando mudar de tab
        window.scrollTo(0, 0);
        
        loadTab(tab);
      });
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authInstance.signOut();
      });
    }
    
    // Busca de usuários com filtro
    const userSearch = document.getElementById('userSearch');
    const userFilter = document.getElementById('userFilter');
    
    const performUserSearch = async () => {
      const term = userSearch?.value.toLowerCase() || '';
      const filter = userFilter?.value || 'all';
      const container = document.getElementById('usersList');
      
      if (!container) return;
      
      if (term.length < 2 && filter === 'all') {
        loadUsers();
        return;
      }
      
      try {
        const snapshot = await dbInstance.collection('users').get();
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Aplicar filtro
          if (filter === 'verified' && !data.verified) return;
          if (filter === 'blocked' && !data.blocked) return;
          if (filter === 'admin' && !data.isAdmin) return;
          
          // Aplicar busca
          if (term.length >= 2) {
            if (!data.name?.toLowerCase().includes(term) && 
                !data.email?.toLowerCase().includes(term)) {
              return;
            }
          }
          
          const card = createUserCard(doc.id, data);
          container.appendChild(card);
        });
      } catch (error) {
        console.error('Erro na busca:', error);
      }
    };
    
    if (userSearch) {
      userSearch.addEventListener('input', performUserSearch);
    }
    
    if (userFilter) {
      userFilter.addEventListener('change', performUserSearch);
    }
    
    // Busca de orações
    const oracaoSearch = document.getElementById('oracaoSearch');
    const oracaoFilter = document.getElementById('oracaoFilter');
    
    const performOracaoSearch = async () => {
      const term = oracaoSearch?.value.toLowerCase() || '';
      const filter = oracaoFilter?.value || 'all';
      const container = document.getElementById('oracoesList');
      
      if (!container) return;
      
      try {
        const snapshot = await dbInstance.collection('oracoes').get();
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Aplicar filtro
          if (filter === 'text' && data.type !== 'text') return;
          if (filter === 'photo' && data.type !== 'photo') return;
          if (filter === 'video' && data.type !== 'video') return;
          if (filter === 'pedido' && !data.isPedidoOracao) return;
          
          // Aplicar busca
          if (term.length >= 2) {
            if (!data.content?.toLowerCase().includes(term) && 
                !data.userName?.toLowerCase().includes(term)) {
              return;
            }
          }
          
          const card = createOracaoCard(doc.id, data);
          container.appendChild(card);
        });
      } catch (error) {
        console.error('Erro na busca:', error);
      }
    };
    
    if (oracaoSearch) {
      oracaoSearch.addEventListener('input', performOracaoSearch);
    }
    
    if (oracaoFilter) {
      oracaoFilter.addEventListener('change', performOracaoSearch);
    }
    
    // Busca de chats
    const chatSearch = document.getElementById('chatSearch');
    const chatFilter = document.getElementById('chatFilter');
    
    const performChatSearch = async () => {
      const term = chatSearch?.value.toLowerCase() || '';
      const filter = chatFilter?.value || 'all';
      const container = document.getElementById('chatsList');
      
      if (!container) return;
      
      try {
        const snapshot = await dbInstance.collection('chats').get();
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Aplicar filtro
          if (filter === 'individual' && data.type !== 'individual') return;
          if (filter === 'group' && data.type !== 'group') return;
          
          // Aplicar busca
          if (term.length >= 2) {
            const name = data.name || '';
            const lastMessage = data.lastMessage?.text || '';
            if (!name.toLowerCase().includes(term) && 
                !lastMessage.toLowerCase().includes(term)) {
              return;
            }
          }
          
          const card = createChatCard(doc.id, data);
          container.appendChild(card);
        });
      } catch (error) {
        console.error('Erro na busca:', error);
      }
    };
    
    if (chatSearch) {
      chatSearch.addEventListener('input', performChatSearch);
    }
    
    if (chatFilter) {
      chatFilter.addEventListener('change', performChatSearch);
    }
    
  }); // Fim do callback waitForFirebase
}); // Fim do DOMContentLoaded

// Verificar se é admin
async function checkAdminStatus() {
  if (!currentUser) return;
  
  try {
    const dbInstance = window.db;
    const authInstance = window.auth;
    if (!dbInstance || !authInstance) {
      console.error('Firebase não está disponível');
      return;
    }
    
    const userDoc = await dbInstance.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.data();
    if (userData && userData.isAdmin) {
      loadTab('dashboard');
    } else {
      alert('Acesso negado. Você não é um administrador.');
      authInstance.signOut();
    }
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
  }
}

// Carregar conteúdo da tab
async function loadTab(tab) {
  switch(tab) {
    case 'dashboard':
      await loadDashboard();
      break;
    case 'dashboard':
      await loadDashboard();
      break;
    case 'requests':
      await loadRequests();
      break;
    case 'users':
      await loadUsers();
      break;
    case 'oracoes':
      await loadOracoes();
      break;
    case 'chats':
      await loadChats();
      break;
    case 'comments':
      await loadComments();
      break;
    case 'quiz':
      await loadQuiz();
      break;
    case 'shop':
      await loadShop();
      break;
    case 'notifications':
      // Não precisa carregar nada, é um formulário
      break;
    case 'reports':
      await loadReports();
      break;
    case 'settings':
      await loadSettings();
      break;
  }
}

// Carregar solicitações
async function loadRequests() {
  const container = document.getElementById('requestsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    const snapshot = await dbInstance.collection('accountRequests')
      .orderBy('createdAt', 'desc')
      .get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhuma solicitação encontrada</div>';
      return;
    }
    
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = createRequestCard(doc.id, data);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar solicitações</div>';
  }
}

// Criar card de solicitação
function createRequestCard(id, data) {
  const card = document.createElement('div');
  card.className = 'item-card';
  
  const status = data.status || 'pending';
  const statusClass = `status-${status}`;
  const statusText = status === 'pending' ? 'Pendente' : status === 'approved' ? 'Aprovado' : 'Rejeitado';
  
  card.innerHTML = `
    <div class="item-title">
      ${data.name}
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
    <div class="item-text"><strong>Email:</strong> ${data.email}</div>
    <div class="item-text"><strong>Data de Nascimento:</strong> ${data.dateOfBirth}</div>
    ${data.phoneNumber ? `<div class="item-text"><strong>WhatsApp:</strong> ${data.phoneNumber}</div>` : ''}
    <div class="item-text"><strong>Data:</strong> ${data.createdAt?.toDate().toLocaleString('pt-BR')}</div>
    ${status === 'pending' ? `
      <div class="item-actions">
        <button class="btn btn-success" onclick="approveRequest('${id}')">Aprovar</button>
        <button class="btn btn-danger" onclick="rejectRequest('${id}')">Rejeitar</button>
      </div>
    ` : ''}
  `;
  
  return card;
}

// Aprovar solicitação
window.approveRequest = async function(requestId) {
  if (!confirm('Deseja aprovar esta solicitação e criar a conta do usuário?')) return;
  
  try {
    const dbInstance = window.db;
    const authInstance = window.auth;
    
    if (!dbInstance || !authInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    const requestDoc = await dbInstance.collection('accountRequests').doc(requestId).get();
    const requestData = requestDoc.data();
    
    if (!requestData) {
      alert('Erro: Solicitação não encontrada');
      return;
    }
    
    // Verificar se o email já existe
    try {
      const signInMethods = await authInstance.fetchSignInMethodsForEmail(requestData.email);
      if (signInMethods && signInMethods.length > 0) {
        alert('Erro: Já existe uma conta com este email');
        return;
      }
    } catch (emailCheckError) {
      // Se der erro ao verificar, continua (pode ser que o email não exista)
      console.log('Verificação de email:', emailCheckError);
    }
    
    // Salvar UID do admin atual (antes de criar novo usuário)
    const adminUid = currentUser.uid;
    
    // Criar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123';
    
    // Criar usuário no Firebase Authentication
    let newUser;
    try {
      const userCredential = await authInstance.createUserWithEmailAndPassword(
        requestData.email,
        tempPassword
      );
      newUser = userCredential.user;
      
      // Atualizar perfil do usuário
      await newUser.updateProfile({
        displayName: requestData.name
      });
      
      // Criar documento do usuário no Firestore
      await dbInstance.collection('users').doc(newUser.uid).set({
        name: requestData.name,
        email: requestData.email,
        phoneNumber: requestData.phoneNumber || null,
        dateOfBirth: requestData.dateOfBirth || null,
        verified: false,
        blocked: false,
        needsPasswordChange: true,
        isAdmin: false,
        coins: 0,
        titles: [],
        purchasedItems: [],
        activeFrame: null,
        activeTheme: null,
        adFreeUntil: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      // Atualizar status da solicitação (usando o UID do admin salvo)
      await dbInstance.collection('accountRequests').doc(requestId).update({
        status: 'approved',
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedBy: adminUid,
        createdUserId: newUser.uid,
        tempPassword: tempPassword,
      });
      
      // Fazer logout do novo usuário criado
      // Nota: O Firebase automaticamente faz login com o novo usuário ao criá-lo
      // Por isso precisamos fazer logout e o admin precisará fazer login novamente
      await authInstance.signOut();
      
      // Mostrar mensagem e redirecionar para login
      alert(`✅ Conta criada com sucesso!\n\n` +
            `Usuário: ${requestData.name}\n` +
            `Email: ${requestData.email}\n` +
            `Senha temporária: ${tempPassword}\n\n` +
            `⚠️ Você será redirecionado para fazer login novamente.`);
      
      // Redirecionar para login após um breve delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      
      return; // Não continuar com o resto do código
      
      alert(`✅ Solicitação aprovada com sucesso!\n\n` +
            `Conta criada para: ${requestData.name}\n` +
            `Email: ${requestData.email}\n` +
            `Senha temporária: ${tempPassword}\n\n` +
            `⚠️ IMPORTANTE: O usuário precisará trocar a senha no primeiro login.`);
      
      loadRequests();
    } catch (createError) {
      console.error('Erro ao criar usuário:', createError);
      
      // Se o erro for porque o email já existe, apenas atualizar o status
      if (createError.code === 'auth/email-already-in-use') {
        alert('Aviso: Já existe uma conta com este email. A solicitação foi marcada como aprovada, mas nenhuma nova conta foi criada.');
        await dbInstance.collection('accountRequests').doc(requestId).update({
          status: 'approved',
          processedAt: firebase.firestore.FieldValue.serverTimestamp(),
          processedBy: currentUser.uid,
        });
        loadRequests();
      } else {
        throw createError;
      }
    }
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    let errorMessage = 'Erro ao aprovar solicitação';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Já existe uma conta com este email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha muito fraca';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    alert('Erro ao aprovar solicitação: ' + errorMessage);
  }
};

// Rejeitar solicitação
window.rejectRequest = async function(requestId) {
  if (!confirm('Deseja rejeitar esta solicitação?')) return;
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    await dbInstance.collection('accountRequests').doc(requestId).update({
      status: 'rejected',
      processedAt: firebase.firestore.FieldValue.serverTimestamp(),
      processedBy: currentUser.uid,
    });
    
    loadRequests();
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    alert('Erro ao rejeitar solicitação');
  }
};

// Carregar usuários
async function loadUsers() {
  const container = document.getElementById('usersList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    const snapshot = await dbInstance.collection('users').get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhum usuário encontrado</div>';
      return;
    }
    
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = createUserCard(doc.id, data);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar usuários</div>';
  }
}

// Criar card de usuário
function createUserCard(id, data) {
  const card = document.createElement('div');
  card.className = 'item-card';
  
  card.innerHTML = `
    <div class="item-title">${data.name || 'Sem nome'}</div>
    <div class="item-text"><strong>Email:</strong> ${data.email}</div>
    <div class="item-text" style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
      <strong>Moedas:</strong> 
      <span style="font-size: 18px; font-weight: bold; color: #FFD700;">${data.coins || 0}</span>
      <button class="btn btn-primary" style="padding: 4px 12px; font-size: 12px;" 
              onclick="showAddCoinsModal('${id}', '${data.name || 'Usuário'}', ${data.coins || 0})">
        + Moedas
      </button>
    </div>
    <div class="item-actions">
      <label class="toggle-switch">
        <input type="checkbox" ${data.verified ? 'checked' : ''} 
               onchange="toggleUserStatus('${id}', 'verified', this.checked)">
        <span class="slider"></span>
      </label>
      <span style="margin: 0 16px;">Verificado</span>
      
      <label class="toggle-switch">
        <input type="checkbox" ${data.blocked ? 'checked' : ''} 
               onchange="toggleUserStatus('${id}', 'blocked', this.checked)">
        <span class="slider"></span>
      </label>
      <span>Bloqueado</span>
    </div>
  `;
  
  return card;
}

// Alternar status do usuário
window.toggleUserStatus = async function(userId, field, value) {
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    await dbInstance.collection('users').doc(userId).update({
      [field]: value,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    alert('Erro ao atualizar usuário');
  }
};

// Carregar orações
async function loadOracoes() {
  const container = document.getElementById('oracoesList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    const snapshot = await dbInstance.collection('oracoes')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhuma oração encontrada</div>';
      return;
    }
    
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = createOracaoCard(doc.id, data);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar orações:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar orações</div>';
  }
}

// Criar card de oração
function createOracaoCard(id, data) {
  const card = document.createElement('div');
  card.className = 'item-card';
  
  const content = data.content?.substring(0, 100) + (data.content?.length > 100 ? '...' : '');
  
  card.innerHTML = `
    <div class="item-title">${data.userName || 'Usuário'}</div>
    <div class="item-text">${content}</div>
    <div class="item-text"><strong>Curtidas:</strong> ${data.likes?.length || 0}</div>
    <div class="item-text"><strong>Comentários:</strong> ${data.comments?.length || 0}</div>
    <div class="item-text"><strong>Data:</strong> ${data.createdAt?.toDate().toLocaleString('pt-BR')}</div>
    <div class="item-actions">
      <button class="btn btn-danger" onclick="deleteOracao('${id}')">Excluir</button>
    </div>
  `;
  
  return card;
}

// Excluir oração
window.deleteOracao = async function(oracaoId) {
  if (!confirm('Deseja excluir esta oração?')) return;
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    await dbInstance.collection('oracoes').doc(oracaoId).delete();
    loadOracoes();
  } catch (error) {
    console.error('Erro ao excluir oração:', error);
    alert('Erro ao excluir oração');
  }
};

// Mostrar modal de adicionar moedas
let currentCoinsUserId = null;
let currentCoinsAmount = 0;

window.showAddCoinsModal = function(userId, userName, currentCoins) {
  currentCoinsUserId = userId;
  currentCoinsAmount = currentCoins || 0;
  
  document.getElementById('coinsUserName').textContent = userName;
  document.getElementById('coinsCurrentAmount').textContent = currentCoinsAmount;
  document.getElementById('coinsAmount').value = 100;
  document.getElementById('coinsAction').value = 'add';
  
  updateCoinsPreview();
  
  const modal = document.getElementById('coinsModal');
  modal.style.display = 'block';
  
  // Event listeners
  document.getElementById('coinsAmount').addEventListener('input', updateCoinsPreview);
  document.getElementById('coinsAction').addEventListener('change', updateCoinsPreview);
  
  document.getElementById('confirmCoinsBtn').onclick = () => confirmAddCoins();
};

function updateCoinsPreview() {
  const amount = parseInt(document.getElementById('coinsAmount').value) || 0;
  const action = document.getElementById('coinsAction').value;
  let newTotal = currentCoinsAmount;
  
  if (action === 'add') {
    newTotal = currentCoinsAmount + amount;
  } else if (action === 'set') {
    newTotal = amount;
  } else if (action === 'subtract') {
    newTotal = Math.max(0, currentCoinsAmount - amount);
  }
  
  document.getElementById('coinsNewTotal').textContent = newTotal;
}

window.closeCoinsModal = function() {
  document.getElementById('coinsModal').style.display = 'none';
  currentCoinsUserId = null;
  currentCoinsAmount = 0;
};

async function confirmAddCoins() {
  if (!currentCoinsUserId) return;
  
  const amount = parseInt(document.getElementById('coinsAmount').value) || 0;
  const action = document.getElementById('coinsAction').value;
  
  if (amount <= 0) {
    alert('Digite uma quantidade válida');
    return;
  }
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    const userRef = dbInstance.collection('users').doc(currentCoinsUserId);
    const userDoc = await userRef.get();
    const currentCoins = userDoc.data().coins || 0;
    
    let newCoins;
    if (action === 'add') {
      newCoins = currentCoins + amount;
    } else if (action === 'set') {
      newCoins = amount;
    } else if (action === 'subtract') {
      newCoins = Math.max(0, currentCoins - amount);
    }
    
    await userRef.update({
      coins: newCoins
    });
    
    alert(`✅ Moedas atualizadas com sucesso!\n\nNovo total: ${newCoins} moedas`);
    closeCoinsModal();
    loadUsers();
  } catch (error) {
    console.error('Erro ao atualizar moedas:', error);
    alert('Erro ao atualizar moedas: ' + error.message);
  }
}


// ==================== DASHBOARD ====================
async function loadDashboard() {
  const container = document.getElementById('dashboardStats');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando estatísticas...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    // Buscar todas as estatísticas
    const [usersSnapshot, oracoesSnapshot, chatsSnapshot, requestsSnapshot] = await Promise.all([
      dbInstance.collection('users').get(),
      dbInstance.collection('oracoes').get(),
      dbInstance.collection('chats').get(),
      dbInstance.collection('accountRequests').get()
    ]);
    
    const totalUsers = usersSnapshot.size;
    const verifiedUsers = usersSnapshot.docs.filter(doc => doc.data().verified).length;
    const blockedUsers = usersSnapshot.docs.filter(doc => doc.data().blocked).length;
    const totalOracoes = oracoesSnapshot.size;
    const totalLikes = oracoesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().likes?.length || 0), 0);
    const totalComments = oracoesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().comments?.length || 0), 0);
    const totalChats = chatsSnapshot.size;
    const pendingRequests = requestsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    
    // Calcular crescimento (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsers = usersSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt >= sevenDaysAgo;
    }).length;
    
    const newOracoes = oracoesSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt >= sevenDaysAgo;
    }).length;
    
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total de Usuários</h3>
          <div class="stat-value">${totalUsers}</div>
          <div class="stat-change">+${newUsers} esta semana</div>
        </div>
        <div class="stat-card">
          <h3>Usuários Verificados</h3>
          <div class="stat-value">${verifiedUsers}</div>
          <div class="stat-change">${Math.round(verifiedUsers/totalUsers*100)}% do total</div>
        </div>
        <div class="stat-card">
          <h3>Usuários Bloqueados</h3>
          <div class="stat-value" style="color: #FF3B30;">${blockedUsers}</div>
        </div>
        <div class="stat-card">
          <h3>Total de Orações</h3>
          <div class="stat-value">${totalOracoes}</div>
          <div class="stat-change">+${newOracoes} esta semana</div>
        </div>
        <div class="stat-card">
          <h3>Total de Curtidas</h3>
          <div class="stat-value">${totalLikes}</div>
        </div>
        <div class="stat-card">
          <h3>Total de Comentários</h3>
          <div class="stat-value">${totalComments}</div>
        </div>
        <div class="stat-card">
          <h3>Total de Chats</h3>
          <div class="stat-value">${totalChats}</div>
        </div>
        <div class="stat-card">
          <h3>Solicitações Pendentes</h3>
          <div class="stat-value" style="color: #FF9500;">${pendingRequests}</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar estatísticas</div>';
  }
}

// ==================== CHATS ====================
async function loadChats() {
  const container = document.getElementById('chatsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    const snapshot = await dbInstance.collection('chats').get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhum chat encontrado</div>';
      return;
    }
    
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = createChatCard(doc.id, data);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar chats:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar chats</div>';
  }
}

function createChatCard(id, data) {
  const card = document.createElement('div');
  card.className = 'item-card';
  
  const type = data.type || 'individual';
  const participants = data.participants?.length || 0;
  const lastMessage = data.lastMessage?.text || 'Nenhuma mensagem';
  
  card.innerHTML = `
    <div class="item-title">
      ${type === 'group' ? (data.name || 'Grupo') : 'Chat Individual'}
      <span style="font-size: 12px; color: #666; margin-left: 8px;">${type === 'group' ? '👥' : '👤'}</span>
    </div>
    <div class="item-text"><strong>Participantes:</strong> ${participants}</div>
    <div class="item-text"><strong>Última mensagem:</strong> ${lastMessage.substring(0, 50)}${lastMessage.length > 50 ? '...' : ''}</div>
    <div class="item-text"><strong>Criado em:</strong> ${data.createdAt?.toDate().toLocaleString('pt-BR')}</div>
    <div class="item-actions">
      <button class="btn btn-danger" onclick="deleteChat('${id}')">Excluir Chat</button>
    </div>
  `;
  
  return card;
}

window.deleteChat = async function(chatId) {
  if (!confirm('Deseja excluir este chat? Todas as mensagens serão perdidas.')) return;
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    // Excluir mensagens do chat
    const messagesSnapshot = await dbInstance.collection('messages')
      .where('chatId', '==', chatId)
      .get();
    
    const deletePromises = messagesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // Excluir o chat
    await dbInstance.collection('chats').doc(chatId).delete();
    
    alert('Chat excluído com sucesso!');
    loadChats();
  } catch (error) {
    console.error('Erro ao excluir chat:', error);
    alert('Erro ao excluir chat');
  }
};

// ==================== COMENTÁRIOS ====================
async function loadComments() {
  const container = document.getElementById('commentsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    const oracoesSnapshot = await dbInstance.collection('oracoes').get();
    const allComments = [];
    
    oracoesSnapshot.forEach(doc => {
      const oracao = doc.data();
      if (oracao.comments && Array.isArray(oracao.comments)) {
        oracao.comments.forEach((comment, index) => {
          allComments.push({
            id: `${doc.id}_${index}`,
            oracaoId: doc.id,
            oracaoContent: oracao.content?.substring(0, 50) || 'Oração',
            ...comment
          });
        });
      }
    });
    
    if (allComments.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum comentário encontrado</div>';
      return;
    }
    
    container.innerHTML = '';
    allComments.forEach(comment => {
      const card = createCommentCard(comment);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar comentários:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar comentários</div>';
  }
}

function createCommentCard(comment) {
  const card = document.createElement('div');
  card.className = 'item-card';
  
  card.innerHTML = `
    <div class="item-title">${comment.userName || 'Usuário'}</div>
    <div class="item-text"><strong>Oração:</strong> ${comment.oracaoContent}...</div>
    <div class="item-text"><strong>Comentário:</strong> ${comment.text}</div>
    <div class="item-text"><strong>Data:</strong> ${comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString('pt-BR') : 'N/A'}</div>
    <div class="item-actions">
      <button class="btn btn-danger" onclick="deleteComment('${comment.oracaoId}', ${comment.id.split('_')[1]})">Excluir</button>
    </div>
  `;
  
  return card;
}

window.deleteComment = async function(oracaoId, commentIndex) {
  if (!confirm('Deseja excluir este comentário?')) return;
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    const oracaoRef = dbInstance.collection('oracoes').doc(oracaoId);
    const oracaoDoc = await oracaoRef.get();
    const oracao = oracaoDoc.data();
    
    if (oracao.comments && Array.isArray(oracao.comments)) {
      oracao.comments.splice(commentIndex, 1);
      await oracaoRef.update({ comments: oracao.comments });
      alert('Comentário excluído com sucesso!');
      loadComments();
    }
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    alert('Erro ao excluir comentário');
  }
};

// ==================== QUIZ ====================
async function loadQuiz() {
  const container = document.getElementById('quizQuestionsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    const snapshot = await dbInstance.collection('quizQuestions').get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhuma pergunta encontrada. <button class="btn btn-primary" onclick="showCreateQuestionModal()">Criar Primeira Pergunta</button></div>';
      return;
    }
    
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = createQuizQuestionCard(doc.id, data);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar quiz:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar perguntas</div>';
  }
}

function createQuizQuestionCard(id, data) {
  const card = document.createElement('div');
  card.className = 'item-card';
  
  card.innerHTML = `
    <div class="item-title">${data.question || 'Pergunta sem título'}</div>
    <div class="item-text"><strong>Opções:</strong> ${data.options?.join(', ') || 'N/A'}</div>
    <div class="item-text"><strong>Resposta Correta:</strong> ${data.options?.[data.correctAnswer] || 'N/A'}</div>
    ${data.reference ? `<div class="item-text"><strong>Referência:</strong> ${data.reference}</div>` : ''}
    <div class="item-actions">
      <button class="btn btn-primary" onclick="editQuizQuestion('${id}')">Editar</button>
      <button class="btn btn-danger" onclick="deleteQuizQuestion('${id}')">Excluir</button>
    </div>
  `;
  
  return card;
}

window.showCreateQuestionModal = function() {
  alert('Funcionalidade de criar pergunta será implementada. Por enquanto, crie diretamente no Firestore.');
};

window.editQuizQuestion = function(id) {
  alert('Funcionalidade de editar pergunta será implementada.');
};

window.deleteQuizQuestion = async function(id) {
  if (!confirm('Deseja excluir esta pergunta?')) return;
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    await dbInstance.collection('quizQuestions').doc(id).delete();
    alert('Pergunta excluída com sucesso!');
    loadQuiz();
  } catch (error) {
    console.error('Erro ao excluir pergunta:', error);
    alert('Erro ao excluir pergunta');
  }
};

window.loadQuizResults = async function() {
  const container = document.getElementById('quizQuestionsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando resultados...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    const snapshot = await dbInstance.collection('quizScores')
      .orderBy('score', 'desc')
      .limit(50)
      .get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhum resultado encontrado</div>';
      return;
    }
    
    container.innerHTML = '<h3>Top 50 Resultados</h3>';
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-title">#${index + 1} - ${data.userName || 'Usuário'}</div>
        <div class="item-text"><strong>Pontuação:</strong> ${data.score}/${data.totalQuestions || 0}</div>
        <div class="item-text"><strong>Acertos:</strong> ${data.correctAnswers || 0}</div>
        <div class="item-text"><strong>Data:</strong> ${data.createdAt?.toDate().toLocaleString('pt-BR')}</div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar resultados:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar resultados</div>';
  }
};

// ==================== SHOP ====================
async function loadShop() {
  const container = document.getElementById('shopItemsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    const snapshot = await dbInstance.collection('shopItems').get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhum item encontrado. <button class="btn btn-primary" onclick="showCreateItemModal()">Criar Primeiro Item</button></div>';
      return;
    }
    
    container.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = createShopItemCard(doc.id, data);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar itens:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar itens</div>';
  }
}

function createShopItemCard(id, data) {
  const card = document.createElement('div');
  card.className = 'item-card';
  
  card.innerHTML = `
    <div class="item-title">${data.name || 'Item sem nome'}</div>
    <div class="item-text"><strong>Descrição:</strong> ${data.description || 'N/A'}</div>
    <div class="item-text"><strong>Tipo:</strong> ${data.type || 'N/A'}</div>
    <div class="item-text"><strong>Preço:</strong> ${data.price || 0} moedas</div>
    <div class="item-text"><strong>Raridade:</strong> ${data.rarity || 'common'}</div>
    <div class="item-actions">
      <button class="btn btn-primary" onclick="editShopItem('${id}')">Editar</button>
      <button class="btn btn-danger" onclick="deleteShopItem('${id}')">Excluir</button>
    </div>
  `;
  
  return card;
}

window.showCreateItemModal = function() {
  // Limpar formulário
  document.getElementById('itemName').value = '';
  document.getElementById('itemDescription').value = '';
  document.getElementById('itemType').value = '';
  document.getElementById('itemPrice').value = '100';
  document.getElementById('itemRarity').value = 'common';
  document.getElementById('itemImageUrl').value = '';
  document.getElementById('itemAvailable').checked = true;
  document.getElementById('itemStock').value = '0';
  
  // Mostrar modal
  const modal = document.getElementById('createItemModal');
  modal.style.display = 'block';
  
  // Event listener para criar item
  document.getElementById('confirmCreateItemBtn').onclick = createShopItem;
};

window.closeCreateItemModal = function() {
  document.getElementById('createItemModal').style.display = 'none';
};

async function createShopItem() {
  const name = document.getElementById('itemName').value.trim();
  const description = document.getElementById('itemDescription').value.trim();
  const type = document.getElementById('itemType').value;
  const price = parseInt(document.getElementById('itemPrice').value);
  const rarity = document.getElementById('itemRarity').value;
  const imageUrl = document.getElementById('itemImageUrl').value.trim();
  const available = document.getElementById('itemAvailable').checked;
  const stock = parseInt(document.getElementById('itemStock').value) || 0;
  
  // Validação
  if (!name || !description || !type || !price || price < 1) {
    alert('Preencha todos os campos obrigatórios (Nome, Descrição, Tipo e Preço)');
    return;
  }
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    // Criar item no Firestore
    const itemData = {
      name: name,
      description: description,
      type: type,
      price: price,
      rarity: rarity,
      available: available,
      stock: stock,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser.uid,
      createdByEmail: currentUser.email
    };
    
    // Adicionar URL da imagem se fornecida
    if (imageUrl) {
      itemData.imageUrl = imageUrl;
    }
    
    await dbInstance.collection('shopItems').add(itemData);
    
    // Log da ação
    await dbInstance.collection('adminLogs').add({
      action: 'Item da loja criado',
      adminEmail: currentUser.email,
      details: `Item: ${name}, Tipo: ${type}, Preço: ${price} moedas`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    alert('✅ Item criado com sucesso!');
    closeCreateItemModal();
    loadShop();
  } catch (error) {
    console.error('Erro ao criar item:', error);
    alert('Erro ao criar item: ' + error.message);
  }
}

// Fechar modal ao clicar fora (já existe uma função window.onclick, vamos atualizar)
const originalOnClick = window.onclick;
window.onclick = function(event) {
  // Chamar função original se existir
  if (originalOnClick && typeof originalOnClick === 'function') {
    originalOnClick(event);
  }
  
  // Fechar modais ao clicar fora
  const coinsModal = document.getElementById('coinsModal');
  const createItemModal = document.getElementById('createItemModal');
  
  if (event.target === coinsModal) {
    closeCoinsModal();
  }
  if (event.target === createItemModal) {
    closeCreateItemModal();
  }
};

window.editShopItem = function(id) {
  alert('Funcionalidade de editar item será implementada.');
};

window.deleteShopItem = async function(id) {
  if (!confirm('Deseja excluir este item?')) return;
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    await dbInstance.collection('shopItems').doc(id).delete();
    alert('Item excluído com sucesso!');
    loadShop();
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    alert('Erro ao excluir item');
  }
};

window.loadPurchases = async function() {
  const container = document.getElementById('shopItemsList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando compras...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    const snapshot = await dbInstance.collection('purchases')
      .orderBy('purchasedAt', 'desc')
      .limit(100)
      .get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhuma compra encontrada</div>';
      return;
    }
    
    container.innerHTML = '<h3>Últimas 100 Compras</h3>';
    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-title">${data.itemName || 'Item'}</div>
        <div class="item-text"><strong>Usuário ID:</strong> ${data.userId}</div>
        <div class="item-text"><strong>Preço:</strong> ${data.price || 0} moedas</div>
        <div class="item-text"><strong>Data:</strong> ${data.purchasedAt?.toDate().toLocaleString('pt-BR')}</div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar compras:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar compras</div>';
  }
};

// ==================== NOTIFICAÇÕES ====================
window.sendNotification = async function() {
  const type = document.getElementById('notificationType').value;
  const userId = document.getElementById('notificationUserId').value;
  const title = document.getElementById('notificationTitle').value;
  const message = document.getElementById('notificationMessage').value;
  
  if (!title || !message) {
    alert('Preencha título e mensagem');
    return;
  }
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    if (type === 'user' && !userId) {
      alert('Digite o ID do usuário');
      return;
    }
    
    let targetUsers = [];
    
    if (type === 'user') {
      targetUsers = [userId];
    } else if (type === 'all') {
      const usersSnapshot = await dbInstance.collection('users').get();
      targetUsers = usersSnapshot.docs.map(doc => doc.id);
    } else if (type === 'verified') {
      const usersSnapshot = await dbInstance.collection('users').where('verified', '==', true).get();
      targetUsers = usersSnapshot.docs.map(doc => doc.id);
    }
    
    const batch = dbInstance.batch();
    targetUsers.forEach(userId => {
      const notificationRef = dbInstance.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: userId,
        type: 'admin',
        title: title,
        message: message,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    alert(`Notificação enviada para ${targetUsers.length} usuário(s)!`);
    
    // Limpar formulário
    document.getElementById('notificationTitle').value = '';
    document.getElementById('notificationMessage').value = '';
    document.getElementById('notificationUserId').value = '';
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    alert('Erro ao enviar notificação: ' + error.message);
  }
};

// ==================== RELATÓRIOS ====================
async function loadReports() {
  const container = document.getElementById('reportsContent');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Carregando relatórios...</div>';
  
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      container.innerHTML = '<div class="empty-state">Erro: Firebase não está disponível</div>';
      return;
    }
    
    // Carregar logs de atividade (se existir)
    const logsSnapshot = await dbInstance.collection('adminLogs')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    if (logsSnapshot.empty) {
      container.innerHTML = '<div class="empty-state">Nenhum log encontrado</div>';
      return;
    }
    
    container.innerHTML = '<h3>Últimas 50 Ações Administrativas</h3>';
    logsSnapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="item-title">${data.action || 'Ação'}</div>
        <div class="item-text"><strong>Admin:</strong> ${data.adminEmail || 'N/A'}</div>
        <div class="item-text"><strong>Detalhes:</strong> ${data.details || 'N/A'}</div>
        <div class="item-text"><strong>Data:</strong> ${data.createdAt?.toDate().toLocaleString('pt-BR')}</div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar relatórios:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar relatórios</div>';
  }
}

window.loadActivityLogs = function() {
  loadReports();
};

window.exportData = async function() {
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    const [users, oracoes, chats] = await Promise.all([
      dbInstance.collection('users').get(),
      dbInstance.collection('oracoes').get(),
      dbInstance.collection('chats').get()
    ]);
    
    const data = {
      users: users.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      oracoes: oracoes.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      chats: chats.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Dados exportados com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    alert('Erro ao exportar dados');
  }
};

// ==================== CONFIGURAÇÕES ====================
async function loadSettings() {
  const container = document.getElementById('settingsContent');
  if (!container) return;
  
  // Configurações já estão no HTML, apenas carregar valores se existirem
  try {
    const dbInstance = window.db;
    if (!dbInstance) return;
    
    const settingsDoc = await dbInstance.collection('settings').doc('general').get();
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      document.getElementById('appName').value = data.appName || 'Orações';
      document.getElementById('maintenanceMode').checked = data.maintenanceMode || false;
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
}

window.saveSettings = async function() {
  try {
    const dbInstance = window.db;
    if (!dbInstance) {
      alert('Erro: Firebase não está disponível');
      return;
    }
    
    const appName = document.getElementById('appName').value;
    const maintenanceMode = document.getElementById('maintenanceMode').checked;
    
    await dbInstance.collection('settings').doc('general').set({
      appName: appName,
      maintenanceMode: maintenanceMode,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: currentUser.uid
    });
    
    // Log da ação
    await dbInstance.collection('adminLogs').add({
      action: 'Configurações atualizadas',
      adminEmail: currentUser.email,
      details: `App: ${appName}, Manutenção: ${maintenanceMode}`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações');
  }
};

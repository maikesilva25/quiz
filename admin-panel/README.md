# Painel Administrativo - Orações

Painel web para gerenciamento administrativo do app Orações.

## Como Iniciar

### Opção 1: Usando Node.js (Recomendado)

1. Abra o terminal na pasta `admin-panel`
2. Execute:
```bash
node server.js
```

3. Acesse no navegador: `http://localhost:3001`

### Opção 2: Usando Python

1. Abra o terminal na pasta `admin-panel`
2. Execute:
```bash
# Python 3
python -m http.server 3001

# Ou Python 2
python -m SimpleHTTPServer 3001
```

3. Acesse no navegador: `http://localhost:3001`

### Opção 3: Usando http-server (se instalado)

```bash
npx http-server -p 3001
```

## Funcionalidades

- ✅ Gerenciamento de Solicitações de Conta
- ✅ Gerenciamento de Usuários (verificar/bloquear)
- ✅ Gerenciamento de Orações (visualizar/excluir)
- ✅ Busca de usuários e orações
- ✅ Autenticação com verificação de admin

## Login

Use as credenciais de um usuário que tenha o campo `isAdmin: true` no Firestore.

## Nota

Certifique-se de que o Firebase está configurado corretamente no arquivo `config.js`.


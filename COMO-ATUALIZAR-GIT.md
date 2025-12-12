# 📤 Como Atualizar o Código no GitHub

## ⚠️ Importante: NÃO é Automático!

O GitHub **NÃO atualiza automaticamente**. Você precisa fazer **commit** e **push** manualmente sempre que fizer alterações.

## 🔄 Processo de Atualização

### Passo 1: Verificar o que foi alterado

```bash
git status
```

Isso mostra quais arquivos foram modificados, adicionados ou removidos.

### Passo 2: Adicionar as alterações

```bash
# Adicionar todos os arquivos modificados
git add .

# OU adicionar arquivos específicos
git add nome-do-arquivo.js
```

### Passo 3: Fazer commit (salvar localmente)

```bash
git commit -m "Descrição do que foi alterado"
```

Exemplos de mensagens:
- `git commit -m "Corrigir bug no ranking"`
- `git commit -m "Adicionar nova funcionalidade de busca"`
- `git commit -m "Atualizar dependências"`

### Passo 4: Enviar para o GitHub (push)

```bash
git push
```

Isso envia suas alterações para o repositório no GitHub.

## 📋 Comandos Rápidos (Tudo de Uma Vez)

```bash
git add .
git commit -m "Sua mensagem aqui"
git push
```

## 🔍 Verificar Status

Para ver o que está pendente:

```bash
git status
```

## 📥 Atualizar Código Local (se alguém mais mexer)

Se você trabalhar em outro computador ou alguém mais fizer alterações:

```bash
git pull
```

Isso baixa as atualizações do GitHub para seu computador.

## ⚙️ Automação (Opcional)

Se você quiser automatizar (não recomendado para iniciantes):

### GitHub Actions
- Pode fazer deploy automático quando você faz push
- Requer configuração avançada

### Hooks do Git
- Pode executar scripts automaticamente
- Requer conhecimento técnico

## 💡 Dica

**Sempre faça commit e push após fazer alterações importantes!**

Fluxo recomendado:
1. Fazer alterações no código
2. Testar localmente
3. `git add .`
4. `git commit -m "Descrição"`
5. `git push`

## ❓ Resumo

- ❌ **NÃO** atualiza automaticamente
- ✅ Você precisa fazer **commit** e **push** manualmente
- ✅ O processo é simples: `git add .` → `git commit -m "mensagem"` → `git push`

---

**Lembre-se:** O Git é um sistema de controle de versão que requer ações manuais. Isso é uma **vantagem** porque você tem controle total sobre quando e o que atualizar!


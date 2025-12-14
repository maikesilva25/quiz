# 🔄 Como Atualizar o App

## 📋 Opções Disponíveis

### 1. ✅ Atualizações OTA (Recomendado - Já Configurado)

**Vantagens:**
- ✅ Atualizações automáticas sem reinstalar o app
- ✅ Rápido e fácil
- ✅ Funciona para mudanças em JavaScript/TypeScript

**Como usar:**
```bash
# 1. Fazer mudanças no código
git add .
git commit -m "Nova funcionalidade"
git push

# 2. Publicar atualização OTA
eas update --branch preview --message "Descrição da atualização"
```

**Requisitos:**
- APK precisa ser construído com OTA habilitado
- Apenas código JavaScript/TypeScript pode ser atualizado
- Mudanças nativas requerem novo APK

---

### 2. 🔨 Novo APK (Sempre Funciona)

**Vantagens:**
- ✅ Funciona para qualquer tipo de mudança
- ✅ Não requer configuração especial

**Como usar:**
```bash
# 1. Fazer mudanças no código
git add .
git commit -m "Nova funcionalidade"
git push

# 2. Construir novo APK no Android Studio
# (Seguir GUIA-BUILD-ANDROID-STUDIO-OTA.md)

# 3. Instalar novo APK no celular
```

**Desvantagens:**
- Requer reinstalação do app
- Usuário precisa baixar e instalar manualmente

---

### 3. 🚀 Script Automatizado (Git + OTA)

Criei um script que facilita o processo:

```bash
# Atualizar código e publicar OTA automaticamente
npm run update:ota "Descrição da atualização"
```

---

## 📝 Processo Recomendado

### Para Mudanças Simples (UI, Lógica, etc.):
1. Fazer mudanças no código
2. Commit e push para Git
3. Publicar atualização OTA
4. Usuários recebem automaticamente

### Para Mudanças Nativas (Novas dependências, etc.):
1. Fazer mudanças no código
2. Commit e push para Git
3. Construir novo APK
4. Distribuir novo APK

---

## 🔍 Verificar Status das Atualizações

```bash
# Ver atualizações publicadas
eas update:list

# Ver detalhes de uma atualização
eas update:view [UPDATE_ID]
```

---

## ⚠️ Limitações

### OTA pode atualizar:
- ✅ Código JavaScript/TypeScript
- ✅ Assets (imagens, fontes)
- ✅ Estilos e layouts
- ✅ Lógica de negócio

### OTA NÃO pode atualizar:
- ❌ Dependências nativas
- ❌ Mudanças no AndroidManifest.xml
- ❌ Mudanças no app.json (algumas)
- ❌ Mudanças no runtimeVersion

---

## 💡 Dica

Para facilitar, você pode criar um script que faz tudo automaticamente:

```bash
# Script: atualizar.sh
#!/bin/bash
git add .
git commit -m "$1"
git push
eas update --branch preview --message "$1"
```

Uso: `./atualizar.sh "Nova funcionalidade"`


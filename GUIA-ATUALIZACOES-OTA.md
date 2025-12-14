# 🚀 Guia de Atualizações OTA (Over-The-Air)

## ✅ Configuração Completa

O sistema de atualizações OTA está configurado usando **Expo Updates**. Isso permite atualizar o app sem precisar passar pelas lojas (Play Store/App Store).

## 📋 Como Funciona

### Vantagens do Expo Updates vs GitHub:
- ✅ **Integração nativa** com Expo
- ✅ **Rollback automático** se houver erro
- ✅ **Controle de versões** por canal (preview/production)
- ✅ **Fácil de usar** - apenas comandos simples
- ✅ **Suporte oficial** do Expo
- ✅ **Gratuito** para projetos pessoais

### O que foi configurado:

1. ✅ `expo-updates` instalado
2. ✅ `app.json` configurado com `runtimeVersion` e `updates`
3. ✅ `AndroidManifest.xml` com atualizações habilitadas
4. ✅ `eas.json` com canais de atualização
5. ✅ Código no `App.tsx` para verificar atualizações automaticamente

## 🔄 Como Publicar uma Atualização

### 1. Fazer alterações no código
```bash
# Faça suas alterações normalmente
git add .
git commit -m "Nova funcionalidade"
git push
```

### 2. Publicar atualização OTA

#### Para Preview (testes):
```bash
eas update --branch preview --message "Descrição da atualização"
```

#### Para Production (usuários finais):
```bash
eas update --branch production --message "Descrição da atualização"
```

### 3. Os usuários receberão automaticamente

- Quando abrirem o app, a atualização será verificada
- Se houver nova versão, será baixada em background
- A atualização será aplicada no próximo restart do app

## 📱 Canais de Atualização

- **preview**: Para builds de teste (APK interno)
- **production**: Para builds de produção (Play Store)

## ⚙️ Configurações Avançadas

### Atualizar runtimeVersion (quando necessário)

Se você adicionar novas dependências nativas ou mudar versão do Expo SDK, atualize o `runtimeVersion` no `app.json`:

```json
{
  "expo": {
    "runtimeVersion": "1.0.1"  // Incremente quando necessário
  }
}
```

**Importante**: Quando mudar o `runtimeVersion`, você precisa fazer um novo build do APK!

### Verificar atualizações manualmente

O código já verifica automaticamente, mas você pode adicionar um botão para verificar manualmente:

```typescript
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  if (Updates.isEnabled) {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      // Reiniciar o app para aplicar
      await Updates.reloadAsync();
    }
  }
}
```

## 🚨 Limitações

### O que PODE ser atualizado via OTA:
- ✅ Código JavaScript/TypeScript
- ✅ Assets (imagens, fontes, etc.)
- ✅ Estilos e layouts
- ✅ Lógica de negócio

### O que NÃO pode ser atualizado via OTA:
- ❌ Dependências nativas (precisa novo build)
- ❌ Mudanças no `app.json` (exceto algumas configurações)
- ❌ Mudanças no `AndroidManifest.xml`
- ❌ Mudanças no `Info.plist` (iOS)
- ❌ Mudanças no `runtimeVersion`

## 📊 Comandos Úteis

### Ver histórico de atualizações:
```bash
eas update:list
```

### Ver detalhes de uma atualização:
```bash
eas update:view [UPDATE_ID]
```

### Reverter uma atualização:
```bash
eas update:rollback [UPDATE_ID]
```

### Publicar para múltiplos canais:
```bash
eas update --branch preview --branch production
```

## 🔍 Troubleshooting

### Atualização não está sendo aplicada?

1. Verifique se o build foi feito com `runtimeVersion` correto
2. Verifique se está usando o canal correto
3. Verifique logs: `eas update:list`
4. Tente fazer um novo build se necessário

### Erro ao publicar atualização?

1. Verifique se está logado: `eas login`
2. Verifique se o projeto está configurado: `eas project:info`
3. Verifique se tem permissões no projeto

## 💡 Dicas

1. **Sempre teste em preview antes de production**
2. **Use mensagens descritivas** nas atualizações
3. **Mantenha o runtimeVersion atualizado** quando necessário
4. **Monitore as atualizações** via dashboard do Expo
5. **Use rollback** se algo der errado

## 📚 Documentação Oficial

- [Expo Updates Docs](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)

---

**Status**: ✅ Configurado e pronto para uso!


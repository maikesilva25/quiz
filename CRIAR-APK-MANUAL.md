# 🔧 Como Criar APK Manualmente

## ❌ Problema Identificado

O build automático não está funcionando porque:
1. Arquivos de configuração podem estar faltando
2. Problemas de conexão com repositórios Maven
3. EAS Build não encontra os arquivos necessários

## ✅ Solução: Build Manual com Android Studio

### Passo 1: Abrir Android Studio

1. Abra o **Android Studio**
2. Vá em: `File` > `Open`
3. Navegue até: `C:\Users\Mk3D_\nossoApp\android`
4. Clique em `OK`

### Passo 2: Aguardar Sincronização

- O Android Studio vai sincronizar o projeto
- Pode levar alguns minutos na primeira vez
- Aguarde até aparecer "Gradle sync finished"

### Passo 3: Gerar APK

1. No menu superior, vá em: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
2. Aguarde o build (1-5 minutos)
3. Quando terminar, aparecerá uma notificação

### Passo 4: Encontrar o APK

1. Clique em "locate" na notificação
2. Ou navegue até:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```

## 🔄 Alternativa: Comando Direto (se funcionar)

```bash
cd c:\Users\Mk3D_\nossoApp\android
gradlew.bat assembleDebug
```

## 📱 Instalar o APK

1. Transfira o APK para seu dispositivo Android
2. Ative "Fontes desconhecidas" nas configurações
3. Toque no APK para instalar
4. Teste o app

## ⚠️ Se o Build Falhar

### Erro de Conexão Maven

1. Verifique sua conexão com internet
2. Tente usar uma VPN se estiver em rede corporativa
3. Configure proxy se necessário

### Erro de Dependências

1. No Android Studio: `File` > `Invalidate Caches / Restart`
2. Selecione: `Invalidate and Restart`
3. Aguarde e tente novamente

## 💡 Dica

Se o build local continuar falhando, use o **EAS Build** que funciona na nuvem:

1. Certifique-se de ter `package.json`, `app.json` e `eas.json` na raiz
2. Execute: `eas build --platform android --profile preview`
3. Aguarde 15-30 minutos
4. Baixe o APK do link fornecido


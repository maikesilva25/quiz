# 🚀 Guia Rápido: Criar APK no Android Studio

## 📍 Passo 1: Abrir o Projeto

1. Abra o **Android Studio**
2. Se já tiver um projeto aberto: `File` > `Close Project`
3. Clique em `Open` ou `File` > `Open`
4. Navegue até: **`C:\Users\Mk3D_\nossoApp\android`**
5. Clique em `OK`
6. ⏳ **Aguarde a sincronização do Gradle** (5-10 minutos na primeira vez)

## 🔨 Passo 2: Gerar o APK

### Método Simples (APK Debug):

1. No menu superior: **`Build`** > **`Build Bundle(s) / APK(s)`** > **`Build APK(s)`**
2. ⏳ Aguarde o build (1-5 minutos)
3. ✅ Quando terminar, aparecerá uma notificação no canto inferior direito
4. Clique em **`locate`** na notificação para abrir a pasta do APK

### Onde está o APK?

```
C:\Users\Mk3D_\nossoApp\android\app\build\outputs\apk\debug\app-debug.apk
```

## ⚠️ Se Der Erro na Sincronização

1. **`File`** > **`Invalidate Caches / Restart`**
2. Selecione: **`Invalidate and Restart`**
3. Aguarde o Android Studio reiniciar
4. Tente abrir o projeto novamente

## 🔧 Se Precisar Configurar o SDK

1. **`File`** > **`Project Structure`** > **`SDK Location`**
2. Caminho do SDK geralmente é:
   ```
   C:\Users\Mk3D_\AppData\Local\Android\Sdk
   ```
3. Se não encontrar, o Android Studio pode baixar automaticamente

## 📱 Instalar o APK no Celular

1. Conecte o celular via USB ou transfira o APK por email/WhatsApp
2. No celular: **Configurações** > **Segurança** > Ative **"Fontes desconhecidas"**
3. Toque no arquivo APK para instalar
4. Pronto! 🎉

---

**Dica:** Se o build demorar muito ou der erro, verifique a aba **`Build`** na parte inferior do Android Studio para ver os logs detalhados.


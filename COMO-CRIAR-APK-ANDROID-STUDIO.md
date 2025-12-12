# 📱 Como Criar APK com Android Studio (Método Mais Confiável)

## ✅ Por que usar Android Studio?

- Mais controle sobre o processo de build
- Logs detalhados de erros
- Não depende do servidor EAS
- Funciona mesmo com problemas de dependências

## 📋 Pré-requisitos

1. **Android Studio** instalado
   - Download: https://developer.android.com/studio
   - Instale o Android SDK e ferramentas necessárias

2. **Java JDK** (geralmente vem com Android Studio)
   - Verifique: `java -version` no terminal

## 🚀 Passo a Passo

### Passo 1: Abrir o Projeto no Android Studio

1. Abra o **Android Studio**
2. Clique em `File` > `Open`
3. Navegue até: `C:\Users\Mk3D_\nossoApp\android`
4. Clique em `OK`
5. Aguarde a sincronização do Gradle (pode levar 5-10 minutos na primeira vez)

### Passo 2: Verificar Configuração

1. Vá em `File` > `Project Structure`
2. Verifique se o SDK do Android está configurado corretamente
3. Feche a janela

### Passo 3: Limpar o Projeto (Opcional mas Recomendado)

1. No menu superior: `Build` > `Clean Project`
2. Aguarde a conclusão
3. Depois: `Build` > `Rebuild Project`

### Passo 4: Gerar o APK

#### Opção A: APK Debug (Mais Rápido)

1. No menu superior: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
2. Aguarde o build (1-5 minutos)
3. Quando terminar, aparecerá uma notificação no canto inferior direito
4. Clique em `locate` na notificação

#### Opção B: APK Release (Otimizado)

1. No menu superior: `Build` > `Generate Signed Bundle / APK`
2. Selecione `APK` e clique em `Next`
3. Selecione o keystore existente ou crie um novo
4. Preencha as informações e clique em `Next`
5. Selecione `release` e clique em `Finish`
6. Aguarde o build

### Passo 5: Encontrar o APK

O APK estará em uma destas localizações:

**APK Debug:**
```
android\app\build\outputs\apk\debug\app-debug.apk
```

**APK Release:**
```
android\app\build\outputs\apk\release\app-release.apk
```

## 🔧 Resolver Problemas Comuns

### Erro: "SDK location not found"

1. `File` > `Project Structure` > `SDK Location`
2. Configure o caminho do Android SDK
3. Geralmente: `C:\Users\[SeuUsuario]\AppData\Local\Android\Sdk`

### Erro: "Gradle sync failed"

1. `File` > `Invalidate Caches / Restart`
2. Selecione: `Invalidate and Restart`
3. Aguarde e tente novamente

### Erro: "Failed to resolve dependencies"

1. Verifique sua conexão com internet
2. `File` > `Settings` > `Build, Execution, Deployment` > `Gradle`
3. Marque "Use Gradle from: 'gradle-wrapper.properties' file"
4. Tente sincronizar novamente

### Erro de Memória

1. `File` > `Settings` > `Build, Execution, Deployment` > `Compiler`
2. Aumente "Build process heap size" para 2048 ou mais
3. Reinicie o Android Studio

## 📱 Instalar o APK no Dispositivo

1. Transfira o APK para seu dispositivo Android (via USB, email, etc.)
2. No dispositivo: `Configurações` > `Segurança` > Ative "Fontes desconhecidas"
3. Toque no arquivo APK para instalar
4. Siga as instruções na tela

## ⚠️ Nota Importante

O build local pode falhar se:
- Node.js estiver na versão 18 (requer versão 20.19.4+)
- Dependências não estiverem instaladas corretamente
- SDK do Android não estiver configurado

**Solução:** O Android Studio geralmente consegue resolver esses problemas automaticamente durante a sincronização.

## 💡 Dica

Se o build falhar no Android Studio, os logs detalhados aparecerão na aba `Build` na parte inferior da tela. Isso ajuda muito a identificar o problema específico.

---

**Este método é mais confiável que o EAS Build quando há problemas de configuração ou dependências.**


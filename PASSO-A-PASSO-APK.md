# 📱 Passo a Passo: Gerar APK no Android Studio

## ✅ Pré-requisitos

1. ✅ Android Studio instalado
2. ✅ Projeto configurado com OTA (já está!)
3. ✅ Java JDK instalado

---

## 🔧 Passo 1: Preparar o Projeto

Abra o terminal na pasta do projeto e execute:

```bash
# Garantir que as dependências estão instaladas
npm install

# Fazer prebuild para gerar/atualizar os arquivos nativos
npx expo prebuild --clean --platform android
```

Isso vai:
- Limpar o diretório `android/` antigo
- Gerar novos arquivos nativos com as configurações atualizadas
- Incluir todas as configurações do OTA

---

## 🔧 Passo 2: Abrir no Android Studio

1. Abra o **Android Studio**
2. Clique em **File > Open**
3. Navegue até a pasta do projeto e selecione a pasta **`android/`**
4. Clique em **OK**
5. Aguarde o Gradle sincronizar (pode demorar alguns minutos na primeira vez)

---

## 🔧 Passo 3: Verificar Configurações

### Verificar se o AndroidManifest.xml está correto:

1. No Android Studio, vá em: `app > src > main > AndroidManifest.xml`
2. Verifique se contém:
   ```xml
   <meta-data android:name="expo.modules.updates.ENABLED" android:value="true"/>
   <meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"/>
   <meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/570ce43d-c739-4747-a8a5-0d8e9d52720f"/>
   ```

### Verificar strings.xml:

1. Vá em: `app > src > main > res > values > strings.xml`
2. Verifique se contém:
   ```xml
   <string name="expo_runtime_version">1.0.0</string>
   ```

---

## 🔧 Passo 4: Configurar Keystore (Primeira Vez)

Se você ainda não tem um keystore, precisa criar um:

1. No Android Studio, vá em: **Build > Generate Signed Bundle / APK**
2. Selecione **APK** e clique em **Next**
3. Clique em **Create new...** para criar um novo keystore
4. Preencha:
   - **Key store path**: Escolha onde salvar (ex: `C:\Users\SeuUsuario\keystore.jks`)
   - **Password**: Crie uma senha forte (ANOTE ESSA SENHA!)
   - **Key alias**: Pode ser `key0` ou qualquer nome
   - **Key password**: Pode ser a mesma do keystore
   - **Validity**: 25 anos (padrão)
   - **Certificate**: Preencha seus dados
5. Clique em **OK**

⚠️ **IMPORTANTE**: Guarde o keystore e a senha em local seguro! Você precisará deles para atualizações futuras.

---

## 🔧 Passo 5: Gerar o APK

1. No Android Studio, vá em: **Build > Generate Signed Bundle / APK**
2. Selecione **APK** e clique em **Next**
3. Selecione seu keystore:
   - **Key store path**: Caminho do seu keystore
   - **Key store password**: Sua senha
   - **Key alias**: Seu alias (ex: `key0`)
   - **Key password**: Senha da key
4. Clique em **Next**
5. Selecione **release** como **Build Variants**
6. Marque **V1 (Jar Signature)** e **V2 (Full APK Signature)**
7. Clique em **Finish**
8. Aguarde o build completar (pode demorar alguns minutos)

---

## 🔧 Passo 6: Encontrar o APK

Após o build completar:

1. O Android Studio mostrará uma notificação: **"APK(s) generated successfully"**
2. Clique em **locate** na notificação, ou
3. Navegue até: `android > app > release > app-release.apk`

---

## 🔧 Passo 7: Instalar no Celular

### Opção 1: Via USB
1. Conecte o celular ao computador via USB
2. Ative a **Depuração USB** no celular
3. Arraste o arquivo `app-release.apk` para o celular
4. No celular, abra o arquivo e instale

### Opção 2: Via Transferência
1. Copie o arquivo `app-release.apk` para o celular (WhatsApp, email, etc.)
2. No celular, abra o arquivo e instale
3. Se necessário, permita instalação de fontes desconhecidas

---

## ✅ Verificar se OTA está Funcionando

Após instalar o APK:

1. Abra o app no celular
2. O app deve verificar atualizações automaticamente
3. Se houver atualizações publicadas, elas serão baixadas e aplicadas
4. Você pode verificar os logs (se tiver acesso) para ver mensagens como:
   - `✅ Nova atualização disponível e baixada!`
   - `✅ App está atualizado!`

---

## 🚨 Troubleshooting

### Erro: "Gradle sync failed"
- Verifique se o Java JDK está instalado
- Tente: **File > Invalidate Caches / Restart**

### Erro: "Keystore not found"
- Verifique o caminho do keystore
- Se não tiver, crie um novo (Passo 4)

### Erro: "Build failed"
- Verifique se todas as dependências foram instaladas: `npm install`
- Tente fazer prebuild novamente: `npx expo prebuild --clean --platform android`

### APK não instala no celular
- Verifique se permitiu instalação de fontes desconhecidas
- Verifique se o celular tem espaço suficiente
- Tente desinstalar a versão anterior primeiro

---

## 📝 Resumo Rápido

```bash
# 1. Preparar
npm install
npx expo prebuild --clean --platform android

# 2. Abrir Android Studio
# File > Open > selecionar pasta android/

# 3. Gerar APK
# Build > Generate Signed Bundle / APK > APK > release

# 4. Instalar no celular
# Copiar app-release.apk para o celular e instalar
```

---

## 🎉 Pronto!

Agora você tem um APK com OTA habilitado. Todas as atualizações futuras podem ser feitas via OTA sem precisar gerar novo APK!


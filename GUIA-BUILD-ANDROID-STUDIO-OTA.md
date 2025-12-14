# 📱 Guia: Construir APK com OTA no Android Studio

## ✅ Configuração Atual

O projeto já está configurado para receber atualizações OTA. Ao construir o APK no Android Studio, siga estes passos:

## 🔧 Passos para Construir o APK

### 1. Preparar o Projeto

```bash
# Garantir que as dependências estão instaladas
npm install

# Fazer prebuild para gerar os arquivos nativos atualizados
npx expo prebuild --clean --platform android
```

### 2. Abrir no Android Studio

1. Abra o Android Studio
2. Abra o projeto: `File > Open` → selecione a pasta `android/`
3. Aguarde o Gradle sincronizar

### 3. Verificar Configurações

O `AndroidManifest.xml` já está configurado com:
- ✅ `expo.modules.updates.ENABLED = true`
- ✅ `expo.modules.updates.EXPO_RUNTIME_VERSION = 1.0.0`
- ✅ `expo.modules.updates.EXPO_UPDATE_URL` configurado
- ✅ `expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH = ALWAYS`

### 4. Construir o APK

1. No Android Studio, vá em `Build > Generate Signed Bundle / APK`
2. Selecione **APK**
3. Selecione seu keystore (ou crie um novo)
4. Selecione **release** como build variant
5. Clique em **Finish**

### 5. Instalar o APK

1. Transfira o APK para o celular
2. Instale o APK
3. Abra o app

## 🔄 Como Funcionam as Atualizações OTA

Após instalar o APK:

1. **Primeira abertura**: O app verifica automaticamente se há atualizações
2. **Se houver atualização**: 
   - A atualização é baixada em background
   - O app reinicia automaticamente para aplicar
3. **Próximas atualizações**: O mesmo processo se repete

## 📝 Publicar Nova Atualização OTA

Após fazer mudanças no código:

```bash
# 1. Fazer commit e push
git add .
git commit -m "Nova funcionalidade"
git push

# 2. Publicar atualização OTA
eas update --branch preview --message "Descrição da atualização"

# Ou para produção:
eas update --branch production --message "Descrição da atualização"
```

## ⚠️ Importante

- O APK precisa ser construído com `runtimeVersion: "1.0.0"` (já configurado)
- O `AndroidManifest.xml` precisa ter as configurações do expo-updates (já configurado)
- As atualizações OTA só funcionam em builds de **release**, não em debug

## 🔍 Verificar se OTA está Funcionando

1. Abra o app no celular
2. Verifique os logs do console (se tiver acesso)
3. Você deve ver mensagens como:
   - `✅ Nova atualização disponível e baixada!`
   - `✅ App está atualizado!`

## 🚨 Troubleshooting

### Atualizações não aparecem?

1. Verifique se o APK foi construído em modo **release**
2. Verifique se o `runtimeVersion` no `app.json` corresponde ao do APK
3. Verifique se as atualizações foram publicadas no canal correto
4. Feche e reabra o app completamente

### Erro ao verificar atualizações?

1. Verifique a conexão com a internet
2. Verifique se a URL do servidor está correta no `AndroidManifest.xml`
3. Verifique os logs do console para mais detalhes


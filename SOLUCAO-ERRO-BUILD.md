# 🔧 Solução: Erro ao Fazer Build Local

## ❌ Erro Encontrado

```
Could not GET 'https://repo.maven.apache.org/maven2/...'
> peer not authenticated
> No PSK available. Unable to resume.
```

## 🔍 Causa

Problema de conexão/autenticação com o repositório Maven. Pode ser:
- Problema de rede/proxy
- Certificados SSL
- Firewall bloqueando conexões

## ✅ Soluções

### Solução 1: Limpar Cache e Tentar Novamente

```bash
cd android
gradlew.bat clean
gradlew.bat --refresh-dependencies
gradlew.bat assembleDebug
```

### Solução 2: Configurar Proxy (se necessário)

Crie/edite `android/gradle.properties`:

```properties
systemProp.http.proxyHost=seu.proxy.com
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=seu.proxy.com
systemProp.https.proxyPort=8080
```

### Solução 3: Usar EAS Build (Recomendado)

O EAS Build não tem esses problemas de rede:

```bash
npm run build:android
```

Ou use o script:
```bash
GERAR-APK.bat
```

### Solução 4: Configurar Repositórios Alternativos

Edite `android/build.gradle` e adicione repositórios:

```gradle
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/google' }
        google()
        mavenCentral()
    }
}
```

### Solução 5: Verificar Certificados SSL

Se estiver em uma rede corporativa, pode precisar importar certificados:

```bash
# Windows - Verificar certificados Java
keytool -list -keystore "%JAVA_HOME%\lib\security\cacerts"
```

## 🚀 Solução Rápida (Recomendada)

**Use EAS Build** - É mais confiável e não tem problemas de rede local:

```bash
npm run build:android
```

O build será feito na nuvem e você receberá um link para download.

## 📋 Checklist

- [ ] Verificar conexão com internet
- [ ] Tentar limpar cache do Gradle
- [ ] Verificar se há proxy/firewall bloqueando
- [ ] Considerar usar EAS Build como alternativa

## 💡 Dica

Para desenvolvimento/testes rápidos, use **EAS Build Preview**:
- Mais rápido que produção
- Não precisa configurar keystore
- Funciona mesmo com problemas de rede local


@echo off
REM Script para atualizar o app via Git + OTA (Windows)
REM 
REM Uso:
REM   update-ota.bat "Descrição da atualização"
REM   update-ota.bat "Corrige bug na tela de login" preview

setlocal

set MESSAGE=%~1
set BRANCH=%~2

if "%MESSAGE%"=="" set MESSAGE=Atualização automática
if "%BRANCH%"=="" set BRANCH=preview

echo 🚀 Iniciando atualização via Git + OTA...
echo.

echo 📋 Verificando mudanças...
git status --porcelain
if %errorlevel% neq 0 (
    echo ⚠️  Nenhuma mudança detectada. Nada para atualizar.
    exit /b 0
)

echo.
echo ✅ Mudanças detectadas!
echo.
set /p CONTINUE="❓ Deseja continuar com a atualização? (s/n): "
if /i not "%CONTINUE%"=="s" (
    if /i not "%CONTINUE%"=="sim" (
        echo ❌ Atualização cancelada.
        exit /b 0
    )
)

echo.
echo 📦 Adicionando arquivos ao Git...
git add .

echo.
echo 💾 Fazendo commit: "%MESSAGE%"
git commit -m "%MESSAGE%"

echo.
echo ⬆️  Enviando para o Git...
git push

echo.
echo 🌐 Publicando atualização OTA no canal "%BRANCH%"...
eas update --branch %BRANCH% --message "%MESSAGE%"

echo.
echo ✅ Atualização concluída com sucesso!
echo 📱 Os usuários receberão a atualização automaticamente ao abrir o app.

endlocal


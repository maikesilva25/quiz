# Script para configurar JAVA_HOME para Eclipse Adoptium JDK 17
# Execute como Administrador para configurar variável de sistema

$javaHomePath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"

# Verificar se o diretório existe
if (Test-Path $javaHomePath) {
    Write-Host "✅ Eclipse Adoptium JDK 17 encontrado em: $javaHomePath" -ForegroundColor Green
    
    # Configurar JAVA_HOME para a sessão atual
    $env:JAVA_HOME = $javaHomePath
    Write-Host "✅ JAVA_HOME configurado para esta sessão: $env:JAVA_HOME" -ForegroundColor Green
    
    # Tentar configurar como variável de usuário (não requer admin)
    try {
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHomePath, [System.EnvironmentVariableTarget]::User)
        Write-Host "✅ JAVA_HOME configurado como variável de usuário" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Não foi possível configurar como variável de usuário: $_" -ForegroundColor Yellow
    }
    
    # Tentar configurar como variável de sistema (requer admin)
    try {
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHomePath, [System.EnvironmentVariableTarget]::Machine)
        Write-Host "✅ JAVA_HOME configurado como variável de sistema" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Para configurar como variável de sistema, execute este script como Administrador" -ForegroundColor Yellow
        Write-Host "   Ou configure manualmente em: Painel de Controle → Sistema → Variáveis de Ambiente" -ForegroundColor Yellow
    }
    
    # Atualizar PATH se necessário
    $currentPath = [System.Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::User)
    $javaBinPath = "$javaHomePath\bin"
    
    if ($currentPath -notlike "*$javaBinPath*") {
        $newPath = "$currentPath;$javaBinPath"
        try {
            [System.Environment]::SetEnvironmentVariable("PATH", $newPath, [System.EnvironmentVariableTarget]::User)
            Write-Host "✅ PATH atualizado para incluir Java bin" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Não foi possível atualizar PATH: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ PATH já contém Java bin" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Configuração concluída!" -ForegroundColor Green
    Write-Host "   Feche e reabra o terminal para aplicar as mudanças." -ForegroundColor Cyan
    Write-Host "   Ou execute: `$env:JAVA_HOME = '$javaHomePath'" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ Eclipse Adoptium JDK 17 não encontrado em: $javaHomePath" -ForegroundColor Red
    Write-Host "   Verifique se o JDK está instalado corretamente." -ForegroundColor Yellow
}


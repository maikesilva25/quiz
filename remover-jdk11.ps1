# Script para remover JDK 11 após fechar processos que o estão usando
# Execute este script após fechar todos os programas que usam Java

$jdk11Path = "C:\Users\Mk3D_\AppData\Local\jdk-11.0.2"

Write-Host "Verificando processos usando JDK 11..." -ForegroundColor Yellow

$processes = Get-Process | Where-Object {$_.Path -like "*jdk-11.0.2*"}

if ($processes) {
    Write-Host "⚠️  Os seguintes processos estão usando JDK 11:" -ForegroundColor Red
    $processes | ForEach-Object {
        Write-Host "  - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Yellow
    }
    Write-Host "`nFeche esses processos e execute este script novamente." -ForegroundColor Yellow
    Write-Host "Ou execute como Administrador para forçar o encerramento." -ForegroundColor Yellow
} else {
    Write-Host "✅ Nenhum processo usando JDK 11 encontrado." -ForegroundColor Green
    
    if (Test-Path $jdk11Path) {
        Write-Host "Removendo JDK 11..." -ForegroundColor Yellow
        try {
            Remove-Item $jdk11Path -Recurse -Force
            Write-Host "✅ JDK 11 removido com sucesso!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro ao remover: $_" -ForegroundColor Red
            Write-Host "Tente executar este script como Administrador." -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ JDK 11 já foi removido." -ForegroundColor Green
    }
}


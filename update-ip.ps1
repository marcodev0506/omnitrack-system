# Script para actualizar la IP en todos los archivos del proyecto
# Ejecutar: .\update-ip.ps1

# Intentar obtener IP automaticamente
$ipconfigOutput = ipconfig
$allIPs = [regex]::Matches($ipconfigOutput, "192\.168\.\d+\.\d+")

if ($allIPs.Count -gt 0) {
    $newIP = $allIPs[0].Value
    Write-Host "IP detectada: $newIP" -ForegroundColor Green
} else {
    # Si no encuentra, usar la IP actual conocida
    $newIP = "192.168.0.110"
    Write-Host "No se detecto IP automaticamente, usando: $newIP" -ForegroundColor Yellow
}

# Archivos a modificar
$files = @(
    "frontend-app\src\App.jsx",
    "frontend-app\src\api.js",
    "mobile-app\app\tracking.jsx",
    "mobile-app\app\index.jsx",
    "mobile-app\App.js",
    "backend-django\core\settings.py"
)

# Patron de IP a buscar (cualquier 192.168.0.X)
$ipPattern = "192\.168\.0\.\d{1,3}"

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $oldContent = $content

        # Reemplazar la IP en todas las ocurrencias
        $content = $content -replace $ipPattern, $newIP

        if ($content -ne $oldContent) {
            Set-Content $file $content -NoNewline
            Write-Host "Updated: $file" -ForegroundColor Cyan
        } else {
            Write-Host "No changes: $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "IP updated to $newIP in all files" -ForegroundColor Green

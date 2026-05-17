# Деплой nasos-magazin в Railway
# Вариант A: railway login
# Вариант B: положите токен в .env.railway → RAILWAY_TOKEN=...

$ErrorActionPreference = "Stop"

if (Test-Path ".env.railway") {
  Get-Content ".env.railway" | ForEach-Object {
    if ($_ -match '^\s*RAILWAY_TOKEN=(.+)$') {
      $env:RAILWAY_TOKEN = $Matches[1].Trim().Trim('"')
    }
  }
}
$ProjectId = "d51fa77c-293f-402f-aa88-e198bef0f258"
$ServiceId = "d21df2f9-47e3-45c8-8ca3-3a39438a82ca"
$EnvironmentId = "63f693bc-cb56-4fce-abc8-a292475a4dca"

Set-Location $PSScriptRoot

if (-not $env:RAILWAY_TOKEN) {
  Write-Host "Проверка входа в Railway..."
  railway whoami
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Выполните railway login ИЛИ создайте .env.railway с RAILWAY_TOKEN"
    exit 1
  }
}

Write-Host "Привязка к проекту..."
railway link -p $ProjectId -e $EnvironmentId -s $ServiceId

Write-Host "Деплой (загрузка и сборка)..."
railway up -d

Write-Host ""
Write-Host "Готово. Откройте Railway Dashboard → Networking → Generate Domain"
Write-Host "https://railway.com/project/$ProjectId/service/$ServiceId"

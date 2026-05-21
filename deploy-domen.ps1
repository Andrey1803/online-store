# Build and pack for domen.by (akvasnab.by)
# Usage: .\deploy-domen.ps1
# FTP: copy .env.domen.example to .env.domen and run again

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Load-EnvDomen {
    $path = Join-Path $PSScriptRoot ".env.domen"
    if (-not (Test-Path $path)) { return }
    Get-Content $path | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $name = $Matches[1].Trim()
            $val = $Matches[2].Trim().Trim('"')
            Set-Item -Path "env:$name" -Value $val
        }
    }
}

Write-Host "=== Build ===" -ForegroundColor Cyan
Load-EnvDomen
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

$releaseDir = Join-Path $PSScriptRoot "release"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
$zipPath = Join-Path $releaseDir ("akvasnab-by-" + (Get-Date -Format "yyyy-MM-dd") + ".zip")

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "dist\*" -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Archive: $zipPath" -ForegroundColor Green

$ftpHost = $env:FTP_HOST
$ftpUser = $env:FTP_USER
$ftpPass = $env:FTP_PASSWORD
$ftpRemote = if ($env:FTP_REMOTE_PATH) { $env:FTP_REMOTE_PATH } else { "/" }

if (-not $ftpHost -or -not $ftpUser -or -not $ftpPass) {
    Write-Host ""
    Write-Host "FTP not configured. Upload manually in ISPmanager:" -ForegroundColor Yellow
    Write-Host "  Unzip $zipPath to site root (akvasnab.by)" -ForegroundColor Yellow
    Write-Host "  Or upload all files from dist\ folder" -ForegroundColor Yellow
    Write-Host "Admin: https://akvasnab.by/admin/login" -ForegroundColor Cyan
    exit 0
}

Write-Host "=== FTP upload to $ftpHost ===" -ForegroundColor Cyan
$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if (-not $curl) {
    Write-Host "curl.exe not found. Use manual upload." -ForegroundColor Red
    exit 1
}

$distRoot = (Resolve-Path "dist").Path
$files = Get-ChildItem $distRoot -Recurse -File
$base = $distRoot.TrimEnd('\') + '\'
foreach ($f in $files) {
    $rel = $f.FullName.Substring($base.Length).Replace('\', '/')
    $remotePath = $ftpRemote.TrimEnd('/') + '/' + $rel
    $url = "ftp://${ftpHost}${remotePath}"
    & curl.exe -sS --ftp-create-dirs -T $f.FullName -u "${ftpUser}:${ftpPass}" $url
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Upload failed: $rel" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK $rel"
}
Write-Host "FTP done. https://akvasnab.by/admin/login" -ForegroundColor Green

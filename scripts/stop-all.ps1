$ErrorActionPreference = 'SilentlyContinue'

# Stop Node.js services started for this project
Get-Process node | Stop-Process -Force

Write-Host 'Procesos Node detenidos.'

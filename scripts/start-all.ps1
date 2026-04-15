$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Start gateway and all microservices in separate windows
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run gateway'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:auth'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:student'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:teacher'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:enrollment'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:academic'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:attendance'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:payment'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "' + $projectRoot + '"; npm run service:notification'

Write-Host 'Servicios lanzados en nuevas ventanas de PowerShell.'

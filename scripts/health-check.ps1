$urls = @(
  'http://localhost:3000/health',
  'http://localhost:3001/health',
  'http://localhost:3002/health',
  'http://localhost:3003/health',
  'http://localhost:3004/health',
  'http://localhost:3005/health',
  'http://localhost:3006/health',
  'http://localhost:3007/health',
  'http://localhost:3008/health'
)

foreach ($u in $urls) {
  try {
    $r = Invoke-RestMethod -Uri $u -Method Get -TimeoutSec 5
    if ($r.PSObject.Properties.Name -contains 'service') {
      Write-Host "OK $u -> $($r.service)"
    } elseif ($r.PSObject.Properties.Name -contains 'message') {
      Write-Host "OK $u -> $($r.message)"
    } else {
      Write-Host "OK $u"
    }
  } catch {
    Write-Host "FAIL $u -> $($_.Exception.Message)"
  }
}

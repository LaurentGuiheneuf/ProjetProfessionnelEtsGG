Set-Location $PSScriptRoot

$fichierSecret = Join-Path $PSScriptRoot '.session-secret'
if (-not (Test-Path $fichierSecret)) {
    $octets = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($octets)
    [Convert]::ToBase64String($octets) | Set-Content -Path $fichierSecret -NoNewline
}

$env:SESSION_SECRET = (Get-Content $fichierSecret -Raw).Trim()
node server.js
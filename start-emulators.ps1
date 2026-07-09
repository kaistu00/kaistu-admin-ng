$dataDir = Join-Path $PSScriptRoot '.emulator-data'

if (Test-Path (Join-Path $dataDir 'firebase-export.json')) {
  Write-Output 'Importing existing data from .emulator-data'
  & npm run emulators:seed
} else {
  Write-Output 'No previous data found - starting clean emulators'
  & npm run emulators:base
}

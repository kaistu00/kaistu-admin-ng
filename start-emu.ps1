$env:Path = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot\bin;" + [Environment]::GetEnvironmentVariable("Path", "User")
Set-Location "D:\kaistu\projects\kaistu-admin-ng"
npx -y firebase-tools@latest emulators:start 2>&1 | Out-File "D:\kaistu\projects\kaistu-admin-ng\emulators.log"

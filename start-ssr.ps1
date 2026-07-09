$env:ENVIRONMENT = "LOCAL"
Set-Location "D:\kaistu\projects\kaistu-admin-ng"
node dist/kaistu-admin-ng/server/server.mjs *>"D:\kaistu\projects\kaistu-admin-ng\ssr.log"

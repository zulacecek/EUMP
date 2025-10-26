@echo off
start cmd /k "cd /d %~dp0Photino\UserInterface && npm run dev"
start cmd /k "cd /d %~dp0Photino && dotnet run"
start cmd /k "cd /d %~dp0WebsocketServer && dotnet run"

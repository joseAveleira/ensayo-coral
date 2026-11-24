@echo off
rem Doble clic para arrancar Ensayo Coral. Se abre solo en el navegador.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No encuentro Node.js. Instalalo desde https://nodejs.org y vuelve a intentarlo.
  pause
  exit /b 1
)
node server.js
pause

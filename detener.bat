@echo off
rem Apaga backend, frontend y la base de datos (sin borrar los datos).
set "RAIZ=%~dp0"
set "RAIZ=%RAIZ:~0,-1%"

for %%P in (3001 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    taskkill /PID %%I /T /F >nul 2>&1
  )
)
echo Backend y frontend detenidos.

cd /d "%RAIZ%"
docker compose stop db
echo Base de datos detenida (los datos se conservan).
pause

@echo off
rem Apaga backend, frontend y la base de datos (sin borrar los datos).
set "RAIZ=%~dp0"
set "RAIZ=%RAIZ:~0,-1%"

echo Deteniendo backend y frontend...
rem Mata nodemon/tsx del backend y vite del frontend, todo el arbol de procesos.
rem Si solo se mata el proceso que escucha en el puerto, nodemon lo reinicia.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'nodemon --exec tsx src.server\.ts|strictPort' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

rem Cierra las ventanas de Backend y Frontend
taskkill /FI "WINDOWTITLE eq Backend - Clinica*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - Clinica*" /T /F >nul 2>&1

rem Verificacion final: si algo sigue escuchando en 3001 o 5173, se mata ese proceso y su arbol
for %%P in (3001 5173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    taskkill /PID %%I /T /F >nul 2>&1
  )
)
timeout /t 2 /nobreak >nul
netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul && echo ATENCION: el puerto 3001 sigue en uso. Cierra manualmente la ventana del backend. || echo Backend detenido.
netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul && echo ATENCION: el puerto 5173 sigue en uso. || echo Frontend detenido.

cd /d "%RAIZ%"
docker compose stop db
echo Base de datos detenida (los datos se conservan).
pause

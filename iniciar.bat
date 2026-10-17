@echo off
setlocal EnableDelayedExpansion
rem Levanta base de datos, backend y frontend de Clinica Odontologica.
rem   iniciar.bat             -> arranca todo (conserva los datos)
rem   iniciar.bat reiniciar   -> borra la base y la crea de cero, como la primera vez

set "RAIZ=%~dp0"
set "RAIZ=%RAIZ:~0,-1%"
set "SERVER=%RAIZ%\REACT-FULLSTACK\server"
set "CLIENT=%RAIZ%\REACT-FULLSTACK\client"
set "LOGS=%RAIZ%\logs"
cd /d "%RAIZ%"
if errorlevel 1 goto :error

echo.
echo === 1. Revisando requisitos ===
where docker >nul 2>&1 || (echo ERROR: Docker no esta instalado. Instala Docker Desktop: https://www.docker.com/products/docker-desktop & goto :error)
docker info >nul 2>&1 || (echo ERROR: Docker no esta corriendo. Abri Docker Desktop, espera a que diga Running y volve a ejecutar. & goto :error)
where node >nul 2>&1 || (echo ERROR: Node.js no esta instalado. Instala la version LTS 22 desde https://nodejs.org & goto :error)
where npm >nul 2>&1 || (echo ERROR: npm no esta disponible. Reinstala Node.js. & goto :error)
node -e "const[a,b]=process.versions.node.split('.').map(Number);process.exit((a>22||(a===22&&b>=12)||(a===20&&b>=19))?0:1)" || (echo ERROR: Node demasiado viejo. Necesitas Node 22 LTS. & goto :error)
echo OK

echo.
echo === 2. Verificando puertos ===
for %%P in (3001 5173) do (
  netstat -ano | findstr /R /C:":%%P .*LISTENING" >nul && (echo ERROR: El puerto %%P ya esta en uso. Ejecuta detener.bat primero. & goto :error)
)
echo Puertos 3001 y 5173 libres

echo.
echo === 3. Archivos de configuracion (.env) ===
if not exist "%SERVER%\.env" (
  > "%SERVER%\.env" (
    echo DATABASE_URL="mysql://root:admin@localhost:3307/consultorioBdd"
    echo DB_HOST=db
    echo DB_USER=root
    echo DB_PASSWORD=admin
    echo DB_NAME=consultorioBdd
    echo PORT=3001
    echo NODE_ENV=development
    echo CLIENT_URL=http://localhost:5173
    echo JWT_SECRET=dev_secret_local_no_usar_en_produccion
    echo JWT_EXPIRES_IN=7d
    echo ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
    echo LOG_LEVEL=debug
  )
  echo Creado server\.env con valores de desarrollo
)
if not exist "%CLIENT%\.env" (
  copy /y "%CLIENT%\.env-example" "%CLIENT%\.env" >nul
  echo Creado client\.env desde .env-example
)

echo.
echo === 4. Base de datos (Docker) ===
if /i "%~1"=="reiniciar" (
  echo ATENCION: "reiniciar" borra TODOS los datos de la base.
  set /p "RESP=Escribi SI para continuar: "
  if not "!RESP!"=="SI" (echo Cancelado. & goto :error)
  docker compose down -v
if errorlevel 1 goto :error
)
rem Solo se levanta el servicio 'db'. El servicio 'app' del docker-compose no se usa.
docker compose up -d db
if errorlevel 1 (echo ERROR: No se pudo iniciar MySQL con docker compose. & goto :error)

echo Esperando a que MySQL cargue el esquema (la primera vez puede tardar 1-2 min)...
set /a INTENTOS=0
:esperar_tablas
set "N=0"
for /f %%C in ('docker compose exec -T db mysql -uroot -padmin -N -D consultorioBdd -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()" 2^>nul') do set "N=%%C"
if !N! GEQ 15 goto :tablas_ok
set /a INTENTOS+=1
if !INTENTOS! GEQ 90 (echo ERROR: MySQL no termino de cargar. Revisa: docker compose logs db & goto :error)
timeout /t 2 /nobreak >nul
goto :esperar_tablas
:tablas_ok
rem Espera a que MySQL escuche por TCP en 3307 (solo lo hace cuando la carga inicial termino)
set /a INTENTOS=0
:esperar_tcp
netstat -ano | findstr /R /C:":3307 .*LISTENING" >nul && goto :tcp_ok
set /a INTENTOS+=1
if !INTENTOS! GEQ 30 (echo ERROR: No se pudo conectar a MySQL en el puerto 3307. & goto :error)
timeout /t 2 /nobreak >nul
goto :esperar_tcp
:tcp_ok
echo MySQL listo

echo.
echo === 5. Backend: dependencias, Prisma, usuarios y piezas dentales ===
cd /d "%SERVER%"
if errorlevel 1 goto :error
if not exist node_modules (
call npm ci
if errorlevel 1 (echo ERROR: Fallo npm ci del backend. & goto :error)
)
call npx prisma generate
if errorlevel 1 (echo ERROR: Fallo prisma generate. & goto :error)
call npx tsx src/scripts/seed_auth.ts
if errorlevel 1 (echo ERROR: Fallo la carga de usuarios de prueba. & goto :error)
call npx tsx src/scripts/seed_dientes.ts
if errorlevel 1 (echo ERROR: Fallo la carga de las piezas dentales. & goto :error)

echo.
echo === 6. Frontend: dependencias ===
cd /d "%CLIENT%"
if errorlevel 1 goto :error
if not exist node_modules (
call npm ci
if errorlevel 1 (echo ERROR: Fallo npm ci del frontend. & goto :error)
)

echo.
echo === 7. Arrancando backend y frontend ===
if not exist "%LOGS%" mkdir "%LOGS%"
start "Backend - Clinica (no cerrar)" cmd /k "cd /d "%SERVER%" && npm run dev"
start "Frontend - Clinica (no cerrar)" cmd /k "cd /d "%CLIENT%" && npm run dev -- --strictPort"

echo Esperando backend y frontend...
set /a INTENTOS=0
:esperar_app
curl -s -o nul -w "%%{http_code}" http://localhost:5173/ | findstr "200" >nul && curl -s -o nul -w "%%{http_code}" http://localhost:3001/ | findstr "200" >nul && goto :app_ok
set /a INTENTOS+=1
if !INTENTOS! GEQ 60 (echo ERROR: La app no respondio. Revisa las ventanas de Backend y Frontend. & goto :error)
timeout /t 2 /nobreak >nul
goto :esperar_app
:app_ok

echo.
echo ============================================================
echo   LISTO. La app esta funcionando.
echo   Abri:  http://localhost:5173
echo.
echo   Usuarios de prueba (contrasenas):
echo     Administrador: admin@consultorio.com    / Admin123!
echo     Odontologo:    odonto@consultorio.com   / Odonto123!
echo     Paciente:      paciente@consultorio.com / Paciente123!
echo.
echo   Para apagar todo: detener.bat
echo ============================================================
start "" http://localhost:5173
pause
exit /b 0

:error
echo.
echo Se detuvo el arranque por un error. Revisa el mensaje de arriba.
pause
exit /b 1

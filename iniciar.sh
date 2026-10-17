#!/usr/bin/env bash
# Levanta base de datos, backend y frontend de Clinica Odontologica.
#   ./iniciar.sh             -> arranca todo (conserva los datos)
#   ./iniciar.sh --reiniciar -> borra la base y la crea de cero, como la primera vez

set -u
RAIZ="$(cd "$(dirname "$0")" && pwd)"
SERVER="$RAIZ/REACT-FULLSTACK/server"
CLIENT="$RAIZ/REACT-FULLSTACK/client"
PIDS="$RAIZ/.pids"
LOGS="$RAIZ/logs"
REINICIAR=0
[ "${1:-}" = "--reiniciar" ] && REINICIAR=1

rojo()  { printf "\033[31m%s\033[0m\n" "$1"; }
verde() { printf "\033[32m%s\033[0m\n" "$1"; }
paso()  { printf "\n\033[1m=== %s ===\033[0m\n" "$1"; }
fallo() { rojo "ERROR: $1"; exit 1; }

puerto_libre() {
  node -e "const s=require('net').createServer();s.once('error',()=>process.exit(1));s.listen($1,()=>s.close(()=>process.exit(0)))" 2>/dev/null
}
esperar() { # esperar <descripcion> <segundos> <comando...>
  local desc="$1" max="$2"; shift 2
  for _ in $(seq 1 "$max"); do
    if "$@" >/dev/null 2>&1; then verde "$desc listo"; return 0; fi
    sleep 1
  done
  return 1
}

paso "1. Revisando requisitos"
command -v docker >/dev/null || fallo "Docker no esta instalado. Instala Docker Desktop: https://www.docker.com/products/docker-desktop"
docker info >/dev/null 2>&1 || fallo "Docker no esta corriendo. Abri Docker Desktop, espera a que diga 'Running' y volve a ejecutar este script."
command -v node >/dev/null || fallo "Node.js no esta instalado. Instala la version LTS (22) desde https://nodejs.org"
command -v npm  >/dev/null || fallo "npm no esta disponible. Reinstala Node.js."
node -e "const[a,b]=process.versions.node.split('.').map(Number);process.exit((a>22||(a===22&&b>=12)||(a===20&&b>=19))?0:1)" \
  || fallo "Node $(node -v) es muy viejo. Necesitas Node 22 LTS (o 20.19+)."
verde "Docker, Node $(node -v) y npm $(npm -v) OK"

paso "2. Verificando puertos"
for p in 3001 5173; do
  puerto_libre "$p" || fallo "El puerto $p ya esta en uso. Ejecuta ./detener.sh o cierra la app que lo usa."
done
verde "Puertos 3001 y 5173 libres"

paso "3. Archivos de configuracion (.env)"
if [ ! -f "$SERVER/.env" ]; then
  cat > "$SERVER/.env" << 'ENVEOF'
DATABASE_URL="mysql://root:admin@localhost:3307/consultorioBdd"
DB_HOST=db
DB_USER=root
DB_PASSWORD=admin
DB_NAME=consultorioBdd
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=dev_secret_local_no_usar_en_produccion
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=debug
ENVEOF
  verde "Creado server/.env con valores de desarrollo"
fi
if [ ! -f "$CLIENT/.env" ]; then
  cp "$CLIENT/.env-example" "$CLIENT/.env"
  verde "Creado client/.env desde .env-example"
fi

paso "4. Base de datos (Docker)"
cd "$RAIZ" || exit 1
if [ "$REINICIAR" -eq 1 ]; then
  rojo "ATENCION: --reiniciar borra TODOS los datos de la base."
  read -r -p "Escribi SI para continuar: " resp
  [ "$resp" = "SI" ] || fallo "Cancelado por el usuario."
  docker compose down -v || fallo "No se pudo borrar el volumen de la base."
fi
# Solo se levanta el servicio 'db'. El servicio 'app' del docker-compose no se usa.
docker compose up -d db || fallo "No se pudo iniciar MySQL con docker compose."

echo "Esperando a que MySQL cargue el esquema (primera vez puede tardar 1-2 min)..."
tablas_ok() {
  local n
  n=$(docker compose exec -T db mysql -uroot -padmin -N -D consultorioBdd \
      -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()" 2>/dev/null | tr -d '\r')
  [ "${n:-0}" -ge 15 ] 2>/dev/null
}
esperar "MySQL" 180 tablas_ok || fallo "MySQL no termino de cargar. Revisa con: docker compose logs db"
# Espera a que el servidor definitivo de MySQL escuche por TCP (el temporal de la primera carga no)
esperar "Conexion TCP a MySQL (3307)" 60 bash -c "echo > /dev/tcp/127.0.0.1/3307" || fallo "No se pudo conectar a MySQL en el puerto 3307."

paso "5. Backend: dependencias, Prisma, usuarios y piezas dentales"
cd "$SERVER" || exit 1
if [ ! -d node_modules ]; then
  npm ci || fallo "Fallo la instalacion de dependencias del backend."
fi
npx prisma generate || fallo "Fallo prisma generate."
npx tsx src/scripts/seed_auth.ts || fallo "Fallo la carga de usuarios de prueba."
npx tsx src/scripts/seed_dientes.ts || fallo "Fallo la carga de las piezas dentales."

paso "6. Frontend: dependencias"
cd "$CLIENT" || exit 1
if [ ! -d node_modules ]; then
  npm ci || fallo "Fallo la instalacion de dependencias del frontend."
fi

paso "7. Arrancando backend y frontend"
mkdir -p "$PIDS" "$LOGS"
cd "$SERVER" && nohup npm run dev > "$LOGS/backend.log" 2>&1 &
echo $! > "$PIDS/backend.pid"
cd "$CLIENT" && nohup npm run dev -- --strictPort > "$LOGS/frontend.log" 2>&1 &
echo $! > "$PIDS/frontend.pid"

esperar "Backend (http://localhost:3001)" 60 curl -fs http://localhost:3001/ || fallo "El backend no respondio. Revisa logs/backend.log"
esperar "Frontend (http://localhost:5173)" 60 curl -fs http://localhost:5173/ || fallo "El frontend no respondio. Revisa logs/frontend.log"

cat << 'FIN'

============================================================
  LISTO. La app esta funcionando.
  Abri:  http://localhost:5173

  Usuarios de prueba (contrasenas):
    Administrador: admin@consultorio.com   / Admin123!
    Odontologo:    odonto@consultorio.com  / Odonto123!
    Paciente:      paciente@consultorio.com / Paciente123!

  Para apagar todo: ./detener.sh
============================================================
FIN
if command -v open >/dev/null; then open http://localhost:5173
elif command -v xdg-open >/dev/null; then xdg-open http://localhost:5173 >/dev/null 2>&1
fi

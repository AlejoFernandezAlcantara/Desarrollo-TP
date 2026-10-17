#!/usr/bin/env bash
# Apaga backend, frontend y la base de datos (sin borrar los datos).
RAIZ="$(cd "$(dirname "$0")" && pwd)"

# Lista el proceso y todos sus descendientes, el padre primero.
# Hay que matar en ese orden: si se mata un hijo antes, nodemon lo reinicia.
arbol() {
  local pid="$1" hijo
  echo "$pid"
  for hijo in $(pgrep -P "$pid" 2>/dev/null); do arbol "$hijo"; done
}

for nombre in backend frontend; do
  f="$RAIZ/.pids/$nombre.pid"
  if [ -f "$f" ]; then
    pids=$(arbol "$(cat "$f")")
    kill $pids 2>/dev/null
    rm -f "$f"
    echo "$nombre detenido"
  fi
done

# Por si quedo algo escuchando en los puertos (sin tocar otros procesos)
sleep 1
for p in 3001 5173; do
  pids=$(lsof -ti tcp:$p -sTCP:LISTEN 2>/dev/null)
  [ -n "$pids" ] && kill $pids 2>/dev/null
done

cd "$RAIZ" && docker compose stop db && echo "Base de datos detenida (los datos se conservan)"

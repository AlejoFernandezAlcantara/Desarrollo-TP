#!/usr/bin/env bash
# Apaga backend, frontend y la base de datos (sin borrar los datos).
RAIZ="$(cd "$(dirname "$0")" && pwd)"

matar_arbol() { # mata un proceso y todos sus hijos
  local pid="$1" hijo
  for hijo in $(pgrep -P "$pid" 2>/dev/null); do matar_arbol "$hijo"; done
  kill "$pid" 2>/dev/null
}

for nombre in backend frontend; do
  f="$RAIZ/.pids/$nombre.pid"
  if [ -f "$f" ]; then
    matar_arbol "$(cat "$f")"
    rm -f "$f"
    echo "$nombre detenido"
  fi
done

# Por si quedo algo escuchando en los puertos
for p in 3001 5173; do
  pids=$(lsof -ti tcp:$p 2>/dev/null)
  [ -n "$pids" ] && kill $pids 2>/dev/null
done

cd "$RAIZ" && docker compose stop db && echo "Base de datos detenida (los datos se conservan)"

#!/bin/sh
# Mise à jour sur le serveur : récupère la branche main, reconstruit et vérifie.
set -eu
cd "$(dirname "$0")/.."

git pull --ff-only
docker compose up -d --build

echo "Attente de l'état « healthy »…"
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' cody)" = "healthy" ]; do
    i=$((i + 1))
    if [ "$i" -ge 30 ]; then
        echo "ÉCHEC : le conteneur n'est pas sain." >&2
        docker logs --tail 40 cody >&2
        exit 1
    fi
    sleep 2
done
echo "Cody est en ligne."

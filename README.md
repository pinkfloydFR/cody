# Cody

Apprendre à programmer par blocs, pour des élèves de 3e et de Seconde (et au-delà).
Site entièrement statique : aucun serveur d'application, aucune base de données, aucun service
extérieur. La progression est enregistrée dans le navigateur.

## Ateliers

- **Traçage** : 13 niveaux, dont des niveaux à couleurs imposées et une création libre.
- **Manutention** : 27 niveaux avec un bras robot (piles, tapis roulants), un centre de tri à
  plateaux tournants, puis un bras pivotant, sur place et sur rail. Les départs sont tirés au hasard : le programme doit
  gérer tous les cas.

Chaque programme peut être relu en Python.

## Lancer avec Docker

Le fichier `docker-compose.yml` est prévu pour un serveur équipé de Traefik (réseau externe
`traefik`) et ne publie aucun port. Copier `deploy/traefik-cody.exemple.yml` dans les règles de
Traefik en y mettant le nom de domaine, puis :

```sh
docker compose up -d --build
```

Mise à jour d'une installation clonée : `./deploy/deployer.sh`.

Pour un essai sans Traefik :

```sh
docker build -t cody . && docker run --rm -p 8099:80 cody
```

Sans Docker : `python -m http.server 8000` dans ce dossier.

## Tests

```sh
node --test tests/*.test.js
```

Les fichiers `tests/navigateur-*.js` s'évaluent dans la page correspondante.

## Bibliothèques et police

| Élément | Version | Licence |
|---|---|---|
| [Blockly](https://github.com/google/blockly) (Google), `js/blockly_compressed.js`, `js/blockly-fr.js`, `media/` | 13.5.0 | [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) |
| [three.js](https://github.com/mrdoob/three.js), `js/three.min.js` | r128 | MIT (en-tête du fichier) |
| Police [Luciole](https://luciole-vision.com/), `fonts/` | | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`fonts/LICENSE.txt`) |

Les décors et les textures 3D sont dessinés par le code du projet.

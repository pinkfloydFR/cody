# Cody — bras pivotant, puis bras pivotant sur rail (niveaux 19 à 27)

## But
Faire travailler la **rotation** du bras, en plus de saisir et poser ; puis combiner rotation et
déplacement sur un rail.

## Décidé avec l'enseignant (27/11/2026)
- Pivot : entrée à l'ouest, face au bras ; trois tapis au nord, à l'est et au sud.
- Rotation par **quart de tour**, à droite ou à gauche.
- Ensuite, des niveaux avec bras pivotant **et** rail.
- Images fixes : `docs/essais/bras-pivotant.html` et `docs/essais/bras-sur-rail.html`.

## Approches
**Rotation**
- **Quart de tour (retenu)** : travaille la rotation, se combine avec « répéter ».
- « Orienter vers N, E, S, O » : plus simple, mais revient au bloc « aller » actuel.

**Déplacement sur le rail**
- **Glisser d'un cran vers l'est ou l'ouest (proposé)** : même logique que le quart de tour.
- « Aller au cran 1, 2 ou 3 » : plus court, mais rien à initialiser ni à compter.

## Tout ce qui suit est une proposition

### Blocs
| Bloc | Effet |
|---|---|
| tourner d'un quart de tour à [droite · gauche] | vu de dessus ; à droite : ouest → nord → est → sud |
| répéter jusqu'à ce que le bras soit [tourné vers l'ouest] | 0 à plusieurs tours : sert à initialiser |
| glisser d'un cran vers [l'est · l'ouest] | rail seulement ; le bras garde son orientation |
| saisir / poser la caisse | du côté visé par le bras |
| répéter [n] fois | |
| répéter tant qu'il y a une caisse ici | « ici » = du côté visé |
| s'il y a une caisse ici … sinon … | |
| si la caisse tenue est [couleur] … sinon … | |

Sur le rail, le bloc « répéter jusqu'à » propose aussi **« au bout ouest du rail »**.

### Règles
- **Initialisation** : au lancement, l'orientation est inconnue (4 cas) ; sur le rail, le cran
  aussi (12 cas). Le programme est vérifié depuis tous ces cas.
- L'entrée est une file (de 1 à 6 caisses, en partie cachées). Les tapis de sortie gardent
  l'ordre d'arrivée, 6 caisses au maximum, et on n'y reprend rien.
- Arrêt avec message et bloc encadré : saisir ou poser là où il n'y a rien ; poser sur
  l'entrée ; reprendre sur une sortie ; sortie ou attente pleine ; pince déjà pleine ou vide ;
  tester la couleur pince vide ; butée du rail ; plus de 500 instructions.

### Plan du rail
```
              A           B           C
              ▲           ▲           ▲
 ENTRÉE ═▶  [cran 1] ── [cran 2] ── [cran 3]  ═▶ D
                          ▼
                      ATTENTE (pile de 4, on peut reprendre)
```
L'entrée ne s'atteint qu'au cran 1, bras vers l'ouest ; D qu'au cran 3, bras vers l'est.

### Niveaux
| N° | Titre | Consigne | Notion |
|---|---|---|---|
| 19 | Demi-tour | Livrer la caisse à l'est | tourner, initialiser |
| 20 | La navette | Tout transférer au nord | boucle ; revenir face à l'entrée |
| 21 | Rouges à part | Rouges au nord, les autres au sud | si… sinon, rotations en miroir |
| 22 | Trois directions | Rouges au nord, bleues à l'est, jaunes au sud | conditions imbriquées |
| 23 | Chacun son tour | Nord, est, sud, puis de nouveau nord… | alterner sans variable |
| 24 | Premier voyage | Livrer la caisse en C | initialiser orientation et position |
| 25 | Bout de ligne | Tout transférer en D | allers-retours sur le rail |
| 26 | Un quai par couleur | Rouges en A, bleues en B, jaunes en C | trier en se déplaçant |
| 27 | Grand final | Rouges en A dès leur arrivée ; puis les bleues en D, la dernière arrivée en premier (4 au plus) | pile d'attente, synthèse |

Arrivages tirés au hasard, avec des cas fixes vérifiés en coulisses ; un cas caché qui échoue
est montré et annoncé. Étoiles : l'optimum de chaque niveau vient d'une solution testée. Si un
niveau demande un programme trop long pour la classe, il sera simplifié et signalé.

### Présentation
- Page « Manutention », deux nouveaux menus : **Pivot** (19 à 23) et **Pivot + rail** (24 à 27).
  Ils s'ajoutent après les niveaux existants, dont les sauvegardes ne bougent pas.
- 3D comme sur les images, avec les mêmes caisses ; rotation et glissement animés ; écran
  « instruction en cours » ; schéma « Objectif » vu de dessus.
- Dessin 2D de secours vu de dessus ; Python en lecture ; page « Aide » complétée.
- 9 nouveaux fonds flous.

## Ordre de réalisation
1. **Pivot** : règles et niveaux (tests écrits d'abord), puis interface et animations.
   L'enseignant teste.
2. **Pivot + rail**, de la même façon, avec ses retours.

## Hors périmètre
Variables et compteurs, angles autres que le quart de tour, plusieurs entrées, tapis
orientables.

## Vérification
Chaque niveau réussi avec sa solution sur des centaines de tirages et depuis tous les départs ;
programmes sans initialisation refusés ; chaque erreur provoquée ; niveaux 1 à 18 intacts ;
3D et 2D ; aucune erreur console ; captures en 1920×1080.

## Laissé à la réalisation
Dimensions, durées d'animation, cadrage, cas de test fixes, thèmes des fonds. Le moteur et le
rendu des deux séries sont communs (le pivot est un rail à un seul cran).

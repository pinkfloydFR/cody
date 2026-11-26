# Cody — centre de tri, niveaux 13 à 18 (design et image validés le 26/11/2026)

## But
Piloter des aiguillages : envoyer chaque caisse à la bonne sortie, dans le bon ordre.

## Décidé avec l'enseignant (26/11/2026)
- Niveaux 13 à 18 : centre de tri **sans bras**, avec des plateaux tournants.
- Ensuite (niveaux 19 et plus) : **bras et tapis orientables**. Design séparé, après les tests de
  cette première étape.

## Approches (pilotage)
- **A. Caisse par caisse (proposée)** : rien n'avance tant que le programme ne le demande pas.
  Tout est prévisible et se relit bloc par bloc.
- B. Tapis qui avancent seuls, à un rythme imposé : plus spectaculaire, mais demande des
  événements et de la synchronisation, une autre notion.

## Tout ce qui suit est une proposition

### Plan du centre
```
                    SORTIE A              SORTIE B
                       ▲                     ▲
 ENTRÉE ═════════▶ (plateau 1) ═════▶ (plateau 2) ═════▶ SORTIE C
 (file, cachée         │
  en partie)           ▼
                    ATTENTE (voie sans issue, 4 caisses)
```
- Plateau 1 : tout droit, sortie A ou attente. Plateau 2 : tout droit ou sortie B.
- L'**attente** est une pile : la dernière caisse entrée ressort la première.
- Les sorties (6 caisses au maximum) gardent l'ordre d'arrivée.
- **Initialisation** : au lancement, les plateaux sont orientés au hasard. Le programme est
  vérifié depuis les 6 combinaisons.

### Blocs
| Bloc | Effet |
|---|---|
| faire entrer la caisse suivante | de l'entrée au plateau 1 |
| orienter le plateau [1 · 2] vers [direction] | le plateau garde cette position |
| envoyer la caisse du plateau [1 · 2] | elle suit l'orientation |
| rappeler une caisse de l'attente | de l'attente au plateau 1 |
| répéter [n] fois | |
| répéter tant qu'une caisse attend [à l'entrée · en attente] | |
| s'il y a une caisse [à l'entrée · en attente] … sinon … | une seule vérification |
| si la caisse du plateau [1 · 2] est [couleur] … sinon … | |

Au plateau 2, « attente » n'est pas proposée (menu des directions adapté ou erreur expliquée).

### Erreurs (arrêt, bloc encadré)
Entrée vide ; plateau déjà occupé (collision) ; envoyer un plateau vide ; tester la couleur d'un
plateau vide ; attente vide ou pleine ; sortie pleine ; direction impossible ; plus de 500
instructions.

### Niveaux
| N° | Titre | Consigne | Notion |
|---|---|---|---|
| 13 | Premier aiguillage | Tout envoyer vers la sortie A | orienter, initialiser, boucle |
| 14 | Rouges à part | Rouges en A, les autres en C | si… sinon ; deux plateaux |
| 15 | Trois destinations | Rouges en A, bleues en B, jaunes en C | conditions imbriquées |
| 16 | Une sur deux | La 1re en A, la 2e en B, la 3e en A… | alterner **sans variable** ; cas impair |
| 17 | Ordre inversé | Tout en C, la dernière arrivée en premier (4 au plus) | la voie d'attente (LIFO) |
| 18 | Chargement du camion | Rouges en A et jaunes en B dès leur arrivée ; puis les bleues en C, la dernière arrivée en premier (4 au plus) | défi : synthèse |

Avec une seule attente, on peut inverser un ordre mais pas le rétablir : aucun niveau ne le
demande. Les arrivages sont tirés au hasard (13 à 18), avec des cas fixes vérifiés en coulisses,
comme aux niveaux précédents. Un cas caché qui échoue est montré et annoncé. Score en étoiles,
optimum établi à partir d'une solution testée.

### Présentation
- Même page « Manutention », groupe **Convoyeurs** ; la barre doit rester lisible avec 18 niveaux.
- 3D de trois quarts, vue d'assez haut pour lire les directions ; mêmes matières et caisses
  numérotées. Chaque plateau montre sa direction par une grande flèche.
- 6 nouveaux décors flous et atténués ; écran « instruction en cours ».
- Dessin 2D de secours : plan vu de dessus.
- Python en lecture ; page d'explications (« 0 ») complétée.
- Moteur dans son propre fichier, testable avec Node (tests écrits d'abord).

## Modification du 26/11/2026 (relevé par l'enseignant)
Une caisse ne peut monter que sur un plateau aligné avec le tapis d'où elle vient (entrée,
attente, ou plateau 1 vers plateau 2). Sinon le programme s'arrête avec un message.

## Ordre de réalisation
1. Image fixe du centre de tri, à valider.
2. Règles et niveaux, testés.
3. Interface et animations.

## Hors périmètre
Rythme imposé, plusieurs entrées, variables et compteurs, bras (étape suivante).

## Vérification
Chaque niveau réussi avec sa solution sur des centaines de tirages et depuis les 6 orientations ;
programmes « en dur » et sans initialisation refusés ; chaque erreur provoquée ; niveaux 1 à 12
intacts ; 3D et 2D ; aucune erreur console ; captures en Full HD.

## Laissé à la réalisation
Dimensions, durées d'animation, cas de test fixes, thèmes des décors.

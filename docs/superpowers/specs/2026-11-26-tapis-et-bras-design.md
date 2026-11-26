# Cody — tapis roulants et bras articulé (design et image validés le 26/11/2026)

## But
Des exercices où les caisses arrivent en flux, et un atelier qui ressemble à une vraie ligne
robotisée (image fournie par l'enseignant : bras orange articulé, tapis, armoire, écran).

## Décidé avec l'enseignant (26/11/2026)
- Les tapis apportent de **nouveaux exercices**.
- Rendu 3D réaliste et texturé conservé.

## Approches (visuel)
- **Bras articulé sur un rail (proposé)** : remplace le portique, atteint toutes les positions
  de façon crédible.
- Bras à base fixe : plus proche de l'image, mais il faut resserrer les postes en arc de cercle,
  et les piles se lisent moins bien.
- Portique conservé et bras en décor : peu de travail, mais le bras ne sert à rien.

## Tout ce qui suit est une proposition

### Postes, de gauche à droite
**Entrée** (tapis) · 1 · 2 · 3 · **Sortie** (tapis).
- **Entrée : une file.** Seule la caisse en tête est accessible : la première arrivée est la
  première servie. Après la saisie, le tapis avance. Poser à l'entrée est une erreur.
  On voit au plus 3 caisses ; les suivantes sont cachées sous un capot.
- **Sortie : un tapis de départ.** Les caisses posées s'alignent dans l'ordre de livraison
  (6 au maximum). Y saisir une caisse est une erreur.
- 1, 2 et 3 restent des **piles** (4 au maximum) : la dernière posée sort la première.
  L'opposition **file / pile** est la notion nouvelle.

### Blocs
Aucun nouveau bloc : « l'entrée » s'ajoute à « aller à », et « tant que la pile ici n'est pas
vide » devient « **tant qu'il y a une caisse ici** » (valable aussi à l'entrée). Les
programmes déjà enregistrés restent valables.

### Nouveaux niveaux (pince en position inconnue au lancement, entrée et sortie comprises)
| N° | Titre | Consigne | Notion | Départs testés |
|---|---|---|---|---|
| 8 | Réception | TRANSFÉRER les 3 caisses de l'entrée vers la sortie | file, répéter | 1 |
| 9 | Flux continu | TRANSFÉRER tout ce qui arrive (1 à 6 caisses) | tant que | plusieurs |
| 10 | Tri à la réception | TRIER : rouges à la sortie, bleues à l'emplacement 3 (4 au plus) | si… sinon | plusieurs |
| 11 | Ordre inversé | EXPÉDIER 1 à 4 caisses, la dernière arrivée en premier | une pile inverse une file | plusieurs |
| 12 | Colis urgents | EXPÉDIER d'abord les rouges, puis les bleues, chaque groupe dans son ordre d'arrivée | défi : synthèse | plusieurs |

Pour le niveau 12 : au plus 4 caisses bleues et 6 caisses en tout.

Les niveaux 1 à 7 gardent consignes, solutions et scores (seul le texte du bloc « tant que »
change). La vérification reste la même : contenu et ordre de chaque poste, pince vide, et
l'entrée doit correspondre à l'objectif. Aux niveaux à plusieurs départs, la solution écrite
« en dur » doit échouer.

La barre des niveaux (12) distingue « Piles » (1 à 7) et « Tapis » (8 à 12).

### Scène 3D
- Bras orange à deux segments et poignet vertical, sur un rail **derrière** les postes, pour
  ne jamais masquer les piles. La pince remonte avant de se déplacer.
- Tapis d'entrée et de sortie avec rouleaux et bandes qui défilent quand une caisse avance.
- Décor discret : armoire de commande, et un écran qui affiche l'instruction en cours.
- Dessin 2D de secours : il garde le portique, avec les deux tapis dessinés simplement.
- Aucun logiciel de dessin, aucune image externe ; l'image fournie sert d'inspiration seulement.

## Ordre de réalisation
1. Image fixe du bras et des tapis, à valider par l'enseignant.
2. Règles et niveaux 8 à 12, testés avec Node (tests écrits d'abord).
3. Animation du bras et des tapis.

## Modification du 26/11/2026 (demande de l'enseignant)
Nouveau bloc « s'il y a une caisse ici … sinon » ; la boucle devient « répéter tant qu'il y a
une caisse ici ».

Niveau 10 remplacé (26/11/2026) par un tri à trois couleurs : rouges à la sortie, bleues au 2,
jaunes au 3 (4 au plus par pile). L'ancien exercice doublait le niveau 7.

## Hors périmètre
Variables et compteurs, caisses arrivant pendant l'exécution à un rythme imposé, plusieurs
bras, intégration dans PlayTP.

## Vérification
Chaque niveau réussi avec sa solution ; nouvelles erreurs provoquées (poser à l'entrée,
saisir à la sortie, sortie pleine) ; niveaux 1 à 7 toujours réussis ; 3D et 2D ; aucune erreur
console ; captures en Full HD.

## Laissé à la réalisation
Proportions et mécanique du bras, durées d'animation, configurations de départ testées.

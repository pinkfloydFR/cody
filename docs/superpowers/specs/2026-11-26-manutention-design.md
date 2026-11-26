# La tortue — atelier « Manutention » (design, validé le 26/11/2026)

## But
Des actions plus complexes que le tracé : réfléchir à l'ordre des opérations (par exemple ne
récupérer que la 2e caisse d'une pile de 3). Même public : 3e, 2de, voire adultes.

## Décidé avec l'enseignant (26/11/2026)
- Bras de manutention vu de face (portique et pince), dans le style « atelier technique ».

## Approches
- **A. Bras vu de face (retenu)** : la pile se lit d'un coup d'œil, l'effort porte sur l'ordre.
- B. Tortue transporteuse vue de dessus : même personnage, mais piles illisibles et pilotage long.

## Tout ce qui suit est une proposition

### Ordre de réalisation
1. Habillage « atelier technique » (voir `2026-11-26-atelier-technique-design.md`), testé seul.
2. Manutention. Deux onglets, « Traçage » et « Manutention » ; l'étape 1 ne montre pas encore
   le second mais prévoit sa place.

### Scène
- 3 emplacements (1, 2, 3) et une **sortie**, 4 caisses au maximum par pile.
- Caisses identifiées par une **lettre et une couleur** (jamais la couleur seule).
- Une vignette « objectif » montre l'état à obtenir.
- Animation sobre, vitesse réglable (maximum = immédiat). Modifié à la réalisation : le réglage
  « mouvements réduits » est ignoré, car il supprimait toute animation sur le PC de test.
- Ajout après essais : rendu 3D texturé (three.js local), dessin 2D en secours.
- Barre d'état : position de la pince, caisse tenue, nombre de mouvements.

### Blocs
- « au lancement », « aller à [1 | 2 | 3 | sortie] », « saisir », « poser », « répéter N fois ».
- Aux niveaux avancés : « tant que la pile ici n'est pas vide », « si la caisse tenue est
  [couleur] … sinon … ».
- La pince ne prend que la caisse du dessus et n'en tient qu'une.

### Niveaux (piles notées de bas en haut)
| N° | Titre | Départ | Objectif | Notion |
|---|---|---|---|---|
| 1 | Première livraison | 1 : A | sortie : A | séquence |
| 2 | La 2e de la pile | 1 : A B C | 1 : A C · sortie : B | mise de côté |
| 3 | La caisse du fond | 1 : A B C | 1 : B C · sortie : A | deux mises de côté, ordre |
| 4 | Déplacer sans inverser | 1 : A B C | 3 : A B C | passer par un tampon |
| 5 | Vider la pile | 1 : A B C D | sortie : D C B A | répéter |
| 6 | Hauteur inconnue | 1 : 1 à 4 caisses | 1 vide, tout en sortie | tant que |
| 7 | Tri par couleur | 1 : rouges et bleues mêlées | rouges en sortie, bleues en 3 | si … sinon |

### Erreurs
Saisir dans une pile vide, saisir en tenant déjà une caisse, poser sans caisse, poser sur une
pile pleine : le programme s'arrête, le bloc fautif est surligné, le panneau explique la cause.
Boucle sans fin : arrêt après une limite d'actions.

### Vérification et score
- Réussi si les piles finales (ordre compris) sont celles de l'objectif et si la pince est vide.
  La position finale de la pince est libre. Le chemin suivi est libre.
- Niveaux 6 et 7 : le programme est contrôlé sur **plusieurs configurations de départ** fixes,
  pour qu'une solution écrite « en dur » échoue. En cas d'échec, la configuration en cause
  est affichée.
- Score : 3 barres, selon le nombre de blocs, comme pour le traçage. L'optimum de chaque
  niveau est établi à partir d'une solution testée.

### Python
Affiché en lecture, avec `aller(2)`, `saisir()`, `poser()`, `while`, `if`. Une ligne en
commentaire précise que ces fonctions sont propres à l'atelier : le code ne s'exécute pas tel
quel ailleurs.

## Contraintes
Celles de l'habillage : Luciole, CSP stricte sans eval, hors ligne, clair et sombre, Full HD.
Le moteur de manutention va dans son propre fichier, séparé de `js/tortue.js`.
Pour PlayTP : seuls le départ et l'objectif sont envoyés à l'élève, jamais le programme modèle.

## Modification du 26/11/2026 (demande de l'enseignant)
Initialisation obligatoire : la pince part d'une position inconnue qui change à chaque essai ; le
programme est vérifié depuis les 4 positions. Les solutions et les optima comptent le bloc
d'initialisation.

## Hors périmètre
Variables, création de niveaux par l'élève, caisses de tailles différentes (tour de Hanoï),
intégration dans PlayTP.

## Vérification
Chaque niveau réussi avec sa solution ; refusés : mauvais ordre, caisse restée dans la pince,
solution « en dur » aux niveaux 6 et 7 ; chaque erreur provoquée ; traçage toujours intact ;
aucune erreur console ; captures 1920×1080 en clair et en sombre.

## Laissé à la réalisation
Dessin du portique, teintes, durées d'animation, configurations de test des niveaux 6 et 7.

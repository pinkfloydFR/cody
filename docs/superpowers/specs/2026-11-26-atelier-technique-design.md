# La tortue — habillage « atelier technique » (design court, validé le 26/11/2026)

## But
Une présentation qui convienne à des préados, ados et adultes : un outil technique, pas un jeu
pour enfants. Choisi par l'enseignant le 26/11/2026 (direction A).

## Périmètre
- Modifiés : `index.html`, `tortue.css`, la partie présentation de `js/tortue.js`, et le CLAUDE.md.
- Inchangés : les 8 niveaux, la vérification, le calcul du score, le Python, la sauvegarde.
- Contraintes : Luciole, CSP stricte (ni JS ni style inline, pas d'eval), hors ligne,
  thèmes clair et sombre, cibles d'au moins 2,75 rem, PC en Full HD.

## Approches
1. **Rhabiller la maquette actuelle (retenue)** : le moteur est déjà testé, seule la présentation change.
2. Réécrire l'interface : aucun gain, risque de casser ce qui fonctionne.

## Design
- **Couleurs** : gris ardoise et blanc cassé, un seul accent bleu pétrole. Vert et rouge
  réservés au résultat. Plus de sable, de corail ni de dégradés.
- **Mise en page** : toute la largeur en 1920×1080, sans défilement pour programmer et lancer.
  Barre du haut fine avec le titre et les niveaux en onglets numérotés. Blocs à gauche, traceur à droite.
- **Traceur** : plan blanc (sombre en thème sombre), grille millimétrée, axes x/y gradués,
  modèle en trait fin pointillé. Barre d'état en direct : x, y, cap, stylo levé/baissé.
- **Tortue** : curseur vectoriel vu de dessus, carapace à facettes, silhouette nette, sans yeux
  ni ombre de dessin animé. La pointe du stylo reste visible. Pas de nage.
- **Blocs** : rendu Blockly compact `thrasos`, couleurs assourdies et lisibles (texte blanc contrasté).
- **Résultat** : panneau de contrôle à la place du message et des confettis : « Tracé conforme »
  ou « Tracé non conforme », nombre de blocs et optimum. Écarts : rouge = manque, violet = dépasse.
- **Score** : les étoiles deviennent 3 barres de niveau, au même calcul.
- **Textes** : sobres, le tutoiement est conservé. « Lancer » → « Exécuter »,
  « Recommencer » → « Réinitialiser » ; le bloc de départ devient « au lancement ».
  Consignes en verbes à l'infinitif, en gras avec majuscule (**TRACER**), comme dans les autres TP.

## Vérification
Les 8 niveaux rejoués avec leur solution (mêmes résultats), un programme faux refusé,
aucune erreur console, captures en 1920×1080 dans les thèmes clair et sombre.

## Laissé à la réalisation
Teintes exactes, graduations, dessin précis du curseur.

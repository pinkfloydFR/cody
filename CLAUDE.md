# CLAUDE.md — Maquette « Cody », ex « La tortue » (futur bloc `:::tortue` de PlayTP)

L'outil s'appelle **Cody** depuis le 26/11/2026 ; le curseur du traçage est un crayon (mine au point
du tracé, orientée selon le cap). Les noms internes (`tortue.js`, blocs `tortue_*`, clés `tortue-*`,
dossier) sont inchangés pour garder les programmes sauvegardés.

Maquette autonome d'un exercice de programmation par blocs, dans l'esprit de la tortue Logo,
pour les élèves de 3e / Seconde. Elle sert à valider l'idée **avant** l'intégration dans
PlayTP (dépôt `pinkfloydFR/PlayTP`). Testée et validée par l'enseignant le 26/11/2026.

## Pourquoi ce projet

- Besoin : une activité de fin d'apprentissage des bases (logique, boucles), graphique et
  ludique, **auto-hébergée**.
- Projets open source existants étudiés : Blockly Games (Google, Apache 2.0, niveau
  « Tortue »), Rapid Router (Code for Life, Django, blocs → Python), Snap! (Berkeley),
  TurboWarp (Scratch), Basthon (Python + `turtle` dans le navigateur), Reeborg's World.
- Décision : plutôt qu'un outil de plus à côté, **intégrer une tortue dans PlayTP**, sous forme
  d'un widget Blockly maison (option « 2 », pensée pour évoluer vers blocs ↔ Python).

## Contenu du dossier

```
index.html          atelier Traçage        (aucun JS ni style inline : CSP de PlayTP)
manutention.html    atelier Manutention    (les onglets sont de simples liens)
tortue.css          styles des deux pages (« atelier technique », clair/sombre)
js/atelier.js       commun : thème Blockly, mémoire, verdict, étoiles
js/tortue.js        traçage
js/manutention-moteur.js   règles, niveaux, vérification (sans DOM, testable avec Node)
js/manutention.js          blocs, animation, dessin 2D de secours
js/manutention-3d.js       rendu 3D du bras et des tapis (textures dessinées dans le code)
js/manutention-decors.js   12 fonds peints dans le code, un par niveau (atelier -> Mars) ; chacun
                           fixe aussi la teinte du sol. Remplacent la tôle ondulée (« rideau »).
                           3D seulement ; le 2D de secours garde son fond quadrillé.
                           Volontairement flous et atténués (`adoucir` : FLOU, DOUCEUR, VOILE).
js/three.min.js            three.js r128 (MIT), copié depuis cdnjs le 26/11/2026
js/blockly_compressed.js, js/blockly-fr.js   Blockly 13.5.0 (npm), messages français
tests/              voir « Tests »
docs/superpowers/   designs et plan du 26/11/2026
docs/essais/        essai 3D jetable (charge three.js depuis Internet)
media/, fonts/      Blockly ; Luciole (licence incluse)
```

Fonctionne hors ligne : ouvrir `index.html`, ou `python -m http.server` dans le dossier.
Dépôt git : `pinkfloydFR/cody` (**public** : n'y mettre ni adresse IP, ni nom de domaine privé,
ni mot de passe).

## Déploiement

Docker : `docker-compose.yml` + `Dockerfile` (nginx, en-têtes dans `deploy/nginx.conf` ; l'image ne
contient que les fichiers servis). **Aucun port publié** : accès par Traefik seulement, avec **le
géoblocage et CrowdSec, et rien d'autre** (demande de l'enseignant ; modèle
`deploy/traefik-cody.exemple.yml`, la vraie règle reste sur le serveur). Le dossier du serveur est
un clone du dépôt : `./deploy/deployer.sh`. Ne déployer que sur demande de l'enseignant.
Les solutions des exercices sont dans les moteurs, donc visibles dans le dépôt public
et dans le navigateur : à traiter avant tout usage noté.

## Présentation (choix de l'enseignant)

Public : préados, ados, adultes. « Atelier technique » : ardoise et blanc cassé, accent bleu
pétrole, vert/rouge pour le résultat ; pas de décor enfantin. **Écran de réussite** demandé par
l'enseignant (`A.feter`) : grandes étoiles, feu d'artifice, « Retenter », « Rejouer au maximum »
(niveaux à nombre de caisses variable : relance le programme avec le plus de caisses possible,
`departMaximum`) et « Niveau suivant »
(absent au dernier niveau ; rien en création libre ni en cas d'échec ; Échap ferme). Score en 3 étoiles (les barres de niveau essayées le
26/11/2026 ont été remplacées par des étoiles à la demande de l'enseignant). Blockly en rendu `cody` (voir « Blocs »). Consignes : verbe à l'infinitif en gras majuscule
(champ `verbe`), tutoiement. Cible : PC en 1920×1080.

## Fonctionnement (js/tortue.js)

- **Blocs** (`tortue_*`) : `depart` (« DÉPART », non supprimable), `avancer`, `reculer`, `tourner` (droite/gauche, degrés),
  `repeter` (N fois, entrée `FAIRE`), `stylo` (lever/baisser), `couleur` (8 pastilles),
  `epaisseur`. Les nombres sont des champs dans le bloc (pas d'entrées à emboîter).
  `Blockly.Events.disableOrphans` grise les blocs non accrochés au départ.
- **Niveaux** (`NIVEAUX`) : titre, `verbe` + `texte` (consigne), indice, `depart [x, y, cap]`, programme modèle
  (`prog`, mini-DSL `R(n, …)`, `fd`, `rt`, `lt`, `up`, `dn`), `opt` (nombre de blocs pour
  3 étoiles), `blocs` (boîte à outils du niveau). 8 niveaux : carré, triangle, escalier,
  étoile, pointillés, rosace, maison, création libre (`prog: null`).
- **Pas d'eval** : `compiler()` parcourt les blocs et produit une liste de commandes
  (`av`, `tr`, `st`, `co`, `ep`, `hl` = surligner le bloc). Limite 20 000 commandes.
- **Repère** : comme Python `turtle` (x à droite, y vers le haut, cap en degrés, 0 = est),
  toile logique 400 × 400, origine au centre ; canevas 800 × 800 (×2 pour la netteté).
  Trois calques : fond (grille, axes gradués, modèle en pointillés), encre, dessus (crayon,
  écarts). L'encre par défaut s'affiche claire en thème sombre. Relevé x, y, cap, crayon.
- **Vérification** : le modèle et le dessin de l'élève sont tracés en noir, trait de 10 px,
  sur une toile cachée ; on compte les pixels différents. Réussi si écart < 5 % des pixels du
  modèle. Échec : calque rouge (manque) / violet (dépasse). La couleur et l'épaisseur
  choisies par l'élève sont ignorées pour la vérification.
- **Barème** affiché sous l'objectif (`A.bareme`, demande de l'enseignant), dans les deux ateliers.
- **Score** (3 étoiles, clé `tortue-etoiles` conservée) : 3 si nb de blocs ≤ `opt`, 2 si ≤ `opt + 2`, sinon 1.
- **Python** : `python()` traduit les blocs en code `turtle` (en-tête `goto` / `setheading`
  pour la position de départ), avec bouton Copier.
- **Sauvegarde** : `localStorage` (`tortue-etoiles`, `tortue-niveau`, `tortue-prog-<n>`),
  dans des try/catch. Dans PlayTP, ce sera remplacé par l'autosave des réponses.
- `window.tortueTest` expose `NIVEAUX`, `ouvrir`, `ws`… pour les tests.

## Niveaux « couleurs » du traçage

- 13 niveaux **classés par difficulté** (remarque de l'enseignant) : carré, carré rouge, triangle,
  escalier, carré bicolore, étoile, pointillés, triangle tricolore, escalier coloré, rosace,
  maison, rosace bicolore, création libre. Niveaux à couleurs (`couleurs: true`) : 2, 5, 8, 9, 12.
  Sauvegardes déplacées par numéro (`tortue-niveaux-couleurs`, `tortue-ordre-difficulte`).
- Modèle dessiné dans ses couleurs ; après la forme (écart < 5 %), `couleursFausses` compare un
  masque par couleur (écart max 8 %). Les consignes **nomment** les couleurs (daltonisme). Ne pas
  créer de modèle où deux couleurs différentes se superposent. L'épaisseur reste ignorée.

## Atelier Manutention

- **Bras articulé sur rail** (image validée par l'enseignant le 26/11/2026 ; remplace le portique,
  qui reste le dessin 2D de secours). Postes : tapis d'**entrée** (`E`, file), piles `1` à `3`
  (4 caisses), tapis de **sortie** (`S`, 6 caisses, ordre de livraison, on n'y reprend rien).
  Chaque caisse porte un **numéro** (plus de lettres, demande de l'enseignant) **et** le nom de sa
  couleur : 1, 2, 3… de bas en haut (piles) ou dans l'ordre d'arrivée (entrée) ; au **niveau 12**
  seulement, c'est le **numéro de sortie attendu**. Sur chaque tapis, 2 caisses entières
  sont visibles, les autres passent sous le capot ; le relevé « livrées » liste toute la sortie.
- Blocs `manut_*` : aller, saisir, poser, repeter, tantque (« répéter tant qu'il y a une caisse
  ici »), sicaisse (« s'il y a une caisse ici … sinon », demandé par l'enseignant : sans lui, les
  élèves prenaient la boucle pour une condition ; proposé partout où `tantque` l'est), si (couleur).
- 12 niveaux, groupes « Piles » (1 à 7) et « Tapis » (8 à 12), optima
  4, 12, 20, 12, 6, 6, 8, 6, 6, 10, 12, 20. Niveau 10 = tri à trois couleurs (`si` imbriqués) :
  l'ancien « Tri à la réception » doublait le niveau 7 (remarque de l'enseignant).
- **Départs aléatoires** (demande de l'enseignant) aux niveaux 6, 7 et 9 à 12 : `niv.hasard(alea)`
  tire un départ à chaque essai ; il est vérifié **en plus** des `configs` fixes (cas limites).
  `verifier(niv, prog, montree, tirage)` rend `cas`, le départ à afficher. Si l'échec vient d'un
  cas caché, il est joué **et annoncé** (« le départ a changé ») : demande de l'enseignant. Les consignes disent ce
  qui varie. Toute modification d'une consigne doit rester cohérente avec les bornes des tirages.
- **Initialisation obligatoire** (demande de l'enseignant) : la position de la pince au lancement
  est inconnue et change à chaque essai. `verifier(niv, prog, montree)` contrôle chaque
  configuration depuis les 5 positions. Défaut d'initialisation = réussit depuis au moins une
  position (`reussiDepuis`) mais pas toutes. Si le programme échoue aussi depuis la position
  montrée, c'est elle qui est rejouée (sinon la pince semblait toujours partir du même endroit).
- Réussite : tous les postes identiques à l'objectif (ordre compris) et pince vide.
- Erreurs : arrêt, bloc encadré en jaune ; limite de 500 instructions.
- `executer()` calcule toute la trace, puis l'interface l'anime (vitesse 5 : résultat immédiat).
  « Mouvements réduits » est volontairement ignoré (un PC sans effets d'animation n'animait rien).
- Le rendu 3D reçoit les mêmes « vues » que le 2D (repère 1200 x 500, `tapis.E/S` = avance des
  tapis, `instruction` = écran). Secours 2D si WebGL échoue ou avec `?2d`.
- Vignette « Objectif » : schéma plat (toutes les caisses), sortie = dernière à gauche. Pas de
  numéro de départ dans la légende (demande de l'enseignant).
- Python en lecture seule. Mémoire : `manut-notes-2`, `manut-niveau`, `manut-prog-<n>`.

- **Page d'explications (bouton « Aide »)** (texte seul, sans score ; demande de l'enseignant) :
  `#intro` dans `manutention.html`, ouvert à la première visite (`manut-intro-vue`) puis par le
  bouton « Aide ». Le tenir à jour quand une règle de l'atelier change.

## Centre de tri (niveaux 13 à 18, groupe « Convoyeurs », même page)

- Barre : bouton « Aide » puis un **menu déroulant par groupe** (Piles, Tapis, Convoyeurs ; demande de
  l'enseignant) avec les étoiles gagnées. Le traçage garde ses boutons en rangée (pas de `groupe`).
- Fichiers : `js/tri-moteur.js` (règles, niveaux, vérification ; Node), `js/tri.js` (blocs `tri_*`,
  géométrie, 2D, objectif, textes), `js/tri-3d.js` (3D). `tri-3d.js` **recopie les matières et les
  caisses** de `manutention-3d.js` : reporter toute retouche dans les deux.
- `manutention.js` est l'interface commune : `kit` vaut `KitBras` ou `window.KitTri` (même
  interface : moteur, compiler, etatDepart, fixe, image, dessin2D, objectif, releve, textes).
- Plan : entrée (file) -> plateau 1 (droit, A, attente) -> plateau 2 (droit, B) -> C. Attente =
  pile de 4 sans issue ; sorties de 6. Caisse par caisse : rien n'avance sans instruction.
- **Alignement obligatoire** (relevé par l'enseignant) : une caisse ne monte que sur un plateau
  aligné avec le tapis d'où elle vient : entrer -> plateau 1 « droit » ; rappeler -> plateau 1
  « attente » ; plateau 1 -> 2 : plateau 2 « droit ».
- Initialisation : orientations de départ inconnues (6 combinaisons, `POSITIONS` « d1,d2 »).
- Optima 5, 9, 11, 12, 12, 20. Départs aléatoires à tous les niveaux + cas fixes.
- Avec une seule attente on inverse un ordre sans pouvoir le rétablir : ne pas créer de niveau
  qui l'exige.

## Bras pivotant (niveaux 19 à 23, groupe « Pivot »)

- Design validé le 27/11/2026 : `docs/superpowers/specs/2026-11-27-bras-pivotant-design.md` ;
  images fixes `docs/essais/bras-pivotant.html` et `bras-sur-rail.html`.
- Fichiers : `js/pivot-moteur.js` (règles, niveaux, vérification ; Node), `js/pivot.js` (blocs
  `pivot_*`, géométrie, 2D, objectif, textes : `window.KitPivot`), `js/pivot-3d.js`. `pivot-3d.js`
  **recopie les matières et les caisses** de `manutention-3d.js` : reporter toute retouche dans les
  trois fichiers 3D.
- Entrée à l'ouest (file), sorties N, E, S (6 caisses, on n'y reprend rien). Rotation par
  **quart de tour** (choix de l'enseignant). La pince et la caisse restent alignées avec les tapis.
- Initialisation : orientation inconnue (4 cas). Bloc « répéter jusqu'à être face à l'ouest ».
- « Il y a une caisse ici » regarde du côté visé, sorties comprises : dans une boucle, le bras doit
  être revenu face à l'entrée en fin de tour.
- Optima 6, 7, 10, 12, 19. Recherche exhaustive : minimum prouvé aux niveaux 19 et 20 ; aux 21 et
  22, rien de plus court jusqu'à 9 blocs pour la forme « jusqu'à + tant que » ; 23 : meilleure
  solution connue.
- Capot absent au tapis sud (il masquerait le bras) : une seule caisse visible au-delà de la place.
- **Pas encore testé par l'enseignant.**

## Suite prévue

- **Pivot + rail** (niveaux 24 à 27, même design), après les retours de l'enseignant sur le pivot :
  3 crans, tapis A, B, C au nord, D à l'est, pile d'attente au sud du cran 2 ; « glisser d'un
  cran » ; le moteur et le rendu du pivot sont à étendre (le pivot est un rail à un seul cran).
- Idée antérieure, non conçue : bras et tapis orientables.

## Blocs (les deux ateliers, `js/atelier.js`)

- **Aucun son** (demande de l'enseignant) : `sounds: false` à l'injection de Blockly et fichiers
  `media/*.mp3` retirés. Ne pas les remettre lors d'une mise à jour de Blockly.
- Rendu `cody` = thrasos + **prise femelle au fond des boucles et conditions** (surcharge de
  `drawStatementInput_`, Blockly 13.5 : à revérifier à chaque mise à jour de Blockly).
- Contour clair sur chaque bloc ; couleurs distinctes pour répéter, tant que et si ; la partie
  « sinon » est plus foncée (copie découpée du contour, `teinterSinon`).
- Bloc de départ : « DÉPART ».

## Boutons sous la scène

- « Exécuter » ; « **Configuration** » (manutention : tire un nouveau départ et remet la scène ;
  nom choisi par l'enseignant. Le traçage garde « Réinitialiser ») ; « **Recommencer le niveau** »
  (les deux ateliers : efface le programme après confirmation, garde les étoiles).

## Tests

- `node --test tests/*.test.js` : 190 tests (bras 103, tri 44, pivot 43).
  `tests/navigateur-pivot.js` : solutions 19 à 23 dans la page.
  `tests/navigateur-tri.js` : solutions 13 à 18 dans la page.
- `tests/navigateur-tracage.js` et `tests/navigateur-manutention.js` : à évaluer dans la page
  (console), ils construisent les solutions en blocs. Ils écrasent les programmes sauvegardés
  du navigateur utilisé.
- 26/11/2026, après habillage : traçage aux mêmes résultats qu'avant (niveaux 1 à 7 optimaux,
  carré à 3 côtés refusé) ; manutention 7/7 conformes ; aucune erreur console ; contrôle visuel
  en 1920 de large, clair et sombre. **Pas encore testé par l'enseignant.**

## Intégration prévue dans PlayTP (à faire, rien n'est commencé)

Suivre le CLAUDE.md de PlayTP (« Nouveau bloc `:::` du format ») :
`app/tp_format/blocks.py` (dataclass `Tortue`) → `parser.py` (`_BLOCS`,
`_valider_ouverture`, `_fermer`) → `templates/blocs/tortue.html` (+ `blocs/papier/`) →
styles dans `base.css` **et** `pdf.css` → `docs/CONVERSION_TP.md`. Déployer l'appli avant de
publier un TP qui l'utilise.

Points d'attention :
- **CSP stricte** (`script-src 'self'`, `style-src 'self'`) : servir Blockly depuis
  `app/static/js/vendor/` ; Blockly injecte un `<style>` par défaut → `Blockly.inject(…, {css:
  false})` et fournir sa CSS dans un fichier ; garder l'interpréteur (jamais d'eval).
- **Anti-triche** : seul le **dessin modèle** est envoyé à l'élève (c'est la consigne) ; le
  programme modèle sert à le tracer. Envoyer de préférence les segments déjà calculés, pas le
  programme, pour ne pas donner la solution dans le JS.
- **Réponse de l'élève** : un nouveau type de champ (programme sérialisé en JSON, réussite,
  nb de blocs), branché sur l'autosave ; progression du sommaire (orange / vert).
- **PDF** : image du dessin final (comme `:::capture`) + éventuellement le code Python.
- **Accessibilité** : Luciole, cibles ≥ 2,75 rem, couleurs dans les trois thèmes de
  `theme.css` + test de contraste.
- **Docker** : rien de spécial (fichiers statiques), à voir au moment de l'intégration.

Exemple de syntaxe envisagée dans un `tp.md` (à arrêter) :

````markdown
:::tortue id=q3 depart="-50 -50 90" blocs="avancer|tourner|repeter" optimal=3
Fais tracer à la tortue un carré de 100 pas de côté.
:::
````
(le modèle serait décrit dans un bloc lié, ou en mini-langage `repeter 4 [avancer 100 droite 90]`).

## Pistes ouvertes

- Intégration PlayTP de la manutention : n'envoyer que départs et objectifs, jamais `prog`
  (dans la maquette, `manutention-moteur.js` contient les solutions).
- Retours des élèves sur le style et la difficulté des niveaux.
- Blocs à ajouter : variables / compteur de boucle, « aller à x y », formes toutes faites.
- Mode texte (Python) pour les plus avancés.
- Notation : score seulement, ou lien avec une compétence (C08 Coder) ?

# CLAUDE.md — Cody (ex « La tortue », futur bloc `:::tortue` de PlayTP)

Maquette autonome de programmation par blocs (Blockly) pour élèves de 3e / Seconde, dans l'esprit
de la tortue Logo, pour valider l'idée **avant** l'intégration dans PlayTP (`pinkfloydFR/PlayTP`).
Validée par l'enseignant le 26/11/2026. Nommée **Cody** le 26/11/2026 ; les noms internes
(`tortue.js`, blocs `tortue_*`, clés `tortue-*`) sont gardés pour ne pas perdre les sauvegardes.

Pourquoi : activité de fin d'apprentissage des bases (logique, boucles), graphique, **auto-hébergée**.
Étudiés : Blockly Games (Apache 2.0, niveau « Tortue »), Rapid Router, Snap!, TurboWarp, Basthon,
Reeborg's World. Décision : un widget Blockly maison intégré à PlayTP, prévu pour aller vers Python.

## Fichiers

```
index.html, manutention.html   ateliers Traçage et Manutention (onglets = simples liens ;
                               aucun JS ni style inline : CSP de PlayTP)
vue.html                       vue 3D seule pour un second écran (js/vue-ecran.js)
tortue.css                     styles (« atelier technique », clair/sombre)
js/atelier.js                  commun : Blockly (thème, rendu « cody »), mémoire, verdict, étoiles,
                               barème, fête, indice, bloc fautif, noms de variables dans les textes,
                               export PDF et espace prof
js/export-pdf.js               PDF sans bibliothèque, empreinte SHA-256
js/tortue.js                   traçage
js/manutention.js              interface commune de la manutention (kits, animation, 2D de secours)
js/manutention-moteur.js, js/tri-moteur.js, js/pivot-moteur.js
                               règles, niveaux, vérification (sans DOM : testés avec Node) ;
                               manutention-moteur.js porte aussi les niveaux « Variables » (28 à 37)
js/tri.js, js/pivot.js         blocs, géométrie, 2D, objectif, textes (KitTri, KitPivot, KitRail)
js/manutention-3d.js, js/tri-3d.js, js/pivot-3d.js
                               rendus 3D (textures dessinées dans le code)
js/commun-3d.js                commun aux rendus 3D : qualité (mode léger), fusion des pièces fixes
js/manutention-decors.js       12 fonds peints dans le code (atelier -> Mars), flous et atténués
                               (`adoucir`) ; chacun fixe la teinte du sol ; 3D seulement
js/three.min.js                three.js r128 (MIT)
js/blockly_compressed.js, js/blockly-fr.js   Blockly 13.5.0, messages français
media/, fonts/                 Blockly (sans sons) ; Luciole (licence incluse)
tests/                         voir « Tests »
docs/captures/                 images du README (LISEZMOI.md) ; docs/superpowers/ : designs et plans ;
                               docs/essais/ : essais 3D jetables (three.js depuis Internet)
```

Hors ligne : ouvrir `index.html`, ou `python -m http.server` dans le dossier.
Dépôt **public** : n'y mettre ni adresse IP, ni nom de domaine privé, ni mot de passe.
Les solutions (`prog` des niveaux) sont dans le JS envoyé au navigateur : rien n'est secret.

## Déploiement

Docker : `docker-compose.yml` + `Dockerfile` (nginx, en-têtes et CSP dans `deploy/nginx.conf` ;
l'image ne contient que les fichiers servis, pas `docs/`). **Aucun port publié** : Traefik seulement,
avec **géoblocage et CrowdSec, rien d'autre** (demande de l'enseignant ; modèle
`deploy/traefik-cody.exemple.yml`). Sur le serveur, un clone du dépôt : `./deploy/deployer.sh`
(pull de la branche courante, reconstruction, attente de l'état « healthy »).

## Présentation et interface (choix de l'enseignant)

- Public : préados, ados, adultes. « Atelier technique » : ardoise et blanc cassé, accent bleu
  pétrole ; pas de décor enfantin. Police Luciole. Cible : PC en 1920×1080.
- Consignes : verbe à l'infinitif en majuscules (champ `verbe`), tutoiement.
- **Score en 3 étoiles** : 3 si nb de blocs ≤ `opt`, 2 si ≤ `opt + 2`, sinon 1 (`A.noter`) ; barème
  affiché sous l'objectif (`A.bareme`).
- **Écran de réussite** (`A.feter`) : étoiles, feu d'artifice, « Retenter », « Rejouer au maximum »
  (départ avec le plus de caisses, `departMaximum`), « Niveau suivant » (absent au dernier niveau ;
  rien en création libre ni en cas d'échec ; Échap ferme).
- **Barre du haut** (52 px) : onglets, logo Python (menu du code, `.menu-python`, avec Copier),
  boutons **PDF**, **Prof** et **clair / sombre** (`changerTheme`, `cody-theme` : **sombre par défaut**
  (choix de l'enseignant, 28/11/2026) ; `A.sombre` imite un MediaQueryList), puis les niveaux (rangée au traçage ; à la manutention, après le bouton
  « Aide », un menu par groupe nommé « LVL1 », « LVL2 »… pour la place ; nom du groupe et étoiles
  gagnées en tête du menu ouvert et dans l'infobulle).
- **Indice** : bouton « ? » ambre à droite du titre (`A.boutonIndice`), fenêtre au milieu de l'écran.
- « Exécuter » joue le départ affiché tant qu'il n'a pas été joué (à l'ouverture du niveau et après
  « Configuration », où l'élève peut en chercher un précis : retour de l'enseignant, 27/11/2026) ; sinon
  il en tire un nouveau (variable `neuf`, `manutention.js`).
- Sous la scène : « Exécuter » ; « Configuration » (manutention : nouveau départ ; « Réinitialiser » au
  traçage) ; « Recommencer le niveau » (efface le programme après confirmation, garde les étoiles).
- En-tête « Ton programme » : « Supprimer les blocs grisés » (`A.boutonNettoyer`) efface les blocs non
  accrochés à DÉPART en un seul groupe d'événements (Ctrl+Z les rend) ; grisé s'il n'y a rien.
- Manutention : colonnes 5/7 (`.jeu-scene`), blocs à l'échelle 1/1,2 (1,1 au traçage), « Objectif » et
  barème sur une ligne sous la consigne (`.objectif-pied`), vignette seule à droite.

## Blocs (`js/atelier.js`)

- Bloc en cours : cadre jaune 6 px + halo (`.blocklyHighlighted`). Bloc où le programme s'arrête :
  cadre rouge clignotant (`A.marquerErreur`, classe `.bloc-fautif`), retiré au prochain essai, au
  changement de niveau ou dès que le programme change (demande de l'enseignant, 27/11/2026).
- **Aucun son** : `sounds: false` et `media/*.mp3` retirés ; ne pas les remettre en mettant Blockly à jour.
- Rendu `cody` = thrasos + **prise femelle au fond des boucles et conditions** (surcharge de
  `drawStatementInput_`), « sinon » d'une branche vide centré sur sa partie (`InfoCody`, surcharge de
  `getElemCenterline_`) ; `MetriquesCody` (surcharge de `getPaddedContent_`) supprime la marge en haut
  et à gauche. **Ces surcharges sont à revérifier à chaque mise à jour de Blockly.**
- Contour clair ; couleurs distinctes pour répéter, tant que et si ; partie « sinon » plus foncée
  (copie découpée du contour, `teinterSinon` dans `manutention.js`). Bloc de départ « DÉPART », non
  supprimable ; `disableOrphans` grise les blocs non accrochés.
- **Explication au survol** de chaque bloc (`A.expliquer`, dans chaque fichier de blocs ; infobulle Blockly
  restylée, `**mot**` en gras, 0,4 s) : phrases pour débutants. Boucles : « les blocs rangés DEDANS »
  (`A.TEXTE_REPETER`), un ami de l'enseignant croyait que « répéter » rejouait les blocs du dessus.
- `A.cadrer` place le programme à 16 px du coin haut gauche au chargement.
- Ascenseurs masqués tant que le programme tient dans la vue (`majAscenseurs`) ; poubelle centrée sous
  les boutons de zoom (`centrerPoubelle`, surcharge de `trashcan.position`) ; blocs redessinés une fois
  Luciole chargée (sinon, police de secours plus étroite : texte qui déborde). **À revérifier à chaque
  mise à jour de Blockly.**

## Atelier Traçage (`js/tortue.js`)

- Blocs `tortue_*` : `depart`, `avancer`, `reculer`, `tourner` (droite/gauche, degrés), `repeter`,
  `stylo`, `couleur` (8 pastilles), `epaisseur`. Nombres en champs dans le bloc.
- 13 niveaux **classés par difficulté** : carré, carré rouge, triangle, escalier, carré bicolore,
  étoile, pointillés, triangle tricolore, escalier coloré, rosace, maison, rosace bicolore, création
  libre (`prog: null`). Champs : titre, `verbe` + `texte`, indice, `depart [x, y, cap]`, `prog`
  (mini-DSL `R(n, …)`, `fd`, `rt`, `lt`, `up`, `dn`, `co`), `opt`, `blocs` (boîte à outils).
- **Accueil** et **Aide** comme à la manutention (`#intro`, `tortue-intro-vue` ; `<dialog id="aide">`,
  sujets : les blocs, avancer et tourner, répéter, le crayon), logique commune `A.aide` (`atelier.js`).
- **Pas d'eval** : `compiler()` produit des commandes (`av`, `tr`, `st`, `co`, `ep`, `hl`) ; limite 20 000.
- Repère de Python `turtle` (cap en degrés, 0 = est), toile logique 400 × 400 centrée, canevas ×2.
  Calques : fond (grille, axes, modèle en pointillés), encre, dessus (crayon, écarts).
- **Vérification** : modèle et dessin tracés en noir (10 px) sur une toile cachée ; réussi si écart
  < 5 % des pixels du modèle (calques rouge = manque, violet = dépasse). Niveaux à couleurs
  (`couleurs: true` : 2, 5, 8, 9, 12) : ensuite un masque par couleur (écart max 8 %). Les consignes
  **nomment** les couleurs (daltonisme) ; jamais deux couleurs superposées dans un modèle. Épaisseur ignorée.
- Python : code `turtle` (en-tête `goto` / `setheading`). Mémoire : `tortue-etoiles`, `tortue-niveau`,
  `tortue-prog-<n>` (dans PlayTP : autosave). `window.tortueTest` pour les tests.

## Atelier Manutention : commun (`js/manutention.js`)

- 37 niveaux en 4 machines + variables : bras (1 à 12, groupes « Piles » et « Tapis »), centre de tri (13 à 18,
  « Convoyeurs »), bras pivotant (19 à 23, « Pivot »), pivot sur rail (24 à 27, « Pivot + rail »), variables (28 à 37, bras sur rail).
  `kit` vaut `KitBras`, `KitTri`, `KitPivot` ou `KitRail` (même interface : moteur, compiler,
  etatDepart, fixe, image, dessin2D, objectif, releve, textes) ; `machine(niv)` d'après le groupe.
- Caisses : un **numéro** et le nom de leur couleur ; numéros = ordre (de bas en haut ou d'arrivée),
  sauf au niveau 12 (numéro de sortie attendu). Vignette « Objectif » : schéma plat.
- **Départs aléatoires** (`niv.hasard(alea)`) vérifiés **en plus** des `configs` fixes (cas limites).
  Si l'échec vient d'un cas caché, il est joué **et annoncé** (« le départ a changé »). Les consignes
  disent ce qui varie : les garder cohérentes avec les bornes des tirages.
- **Initialisation obligatoire** : l'état de la machine au lancement (pince, plateaux, bras) est
  inconnu ; `verifier` contrôle toutes les positions. Défaut d'initialisation = réussit depuis
  certaines (`reussiDepuis`) mais pas toutes ; la position qui échoue est rejouée.
- Réussite : postes identiques à l'objectif (ordre compris), pince vide, variables contrôlées (`varsFin`)
  justes. Erreur : arrêt, bloc fautif en rouge clignotant ; 500 instructions max. `executer()` calcule la trace, l'interface l'anime (vitesse 5 :
  immédiat ; « mouvements réduits » volontairement ignoré).
- La 3D reçoit les mêmes « vues » que le 2D ; 2D de secours si WebGL échoue ou avec `?2d`.
- **Accueil** (`#intro`, à la première visite : `manut-intro-vue`) : trois étapes (« Glisse tes ordres,
  dans l'ordre, sous le bloc gris DÉPART », demande de l'enseignant) et la règle « tous
  les cas » en mots simples, bouton « C'est parti ! » (rouvre le niveau en cours). Rien d'autre : l'ancienne
  page d'aide, qui servait d'accueil, faisait peur (retour de l'enseignant, 28/11/2026).
- **Aide** (bouton « Aide », caché sur l'accueil ; `<dialog id="aide">`, `A.aide`) : pour grands débutants
  (« que ma maman comprenne »), un sujet à la fois (onglets à gauche) : les blocs, les caisses, préparer
  la machine, répéter, choisir, variables. Seuls les sujets utiles au niveau ouvert sont proposés
  (`data-blocs` : un de ces blocs dans la boîte ; `data-variables`). Blocs miniatures en CSS (`.mb-*`,
  mêmes couleurs qu'`atelier.js`). « Revoir l'accueil » en pied. **La tenir à jour quand une règle
  change** et qu'elle tienne en 1920 x 1080.
- **Second écran** : bouton (deux moniteurs) en haut à gauche de la scène, masqué seulement si
  `getScreenDetails()` (autorisé) ne voit qu'un écran (`screen.isExtended` ment dans Brave). Ouvre
  `vue.html` sur l'autre écran (autorisation « gestion des fenêtres » ; sinon fenêtre à déplacer,
  1280 x 720 sous Firefox) ; vues par postMessage (`init`, `vue`), encart « Ramener la vue ici »,
  « Plein écran ». Fermer la fenêtre ramène la vue.
- Python en lecture seule. Mémoire : `manut-notes-2`, `manut-niveau`, `manut-prog-<n>`.

## Bras sur rail (niveaux 1 à 12, `manutention-moteur.js`, `manutention-3d.js`)

- Postes : entrée `E` (file), piles `1` à `3` (4 caisses), sortie `S` (6, ordre de livraison, on
  n'y reprend rien). Sur chaque tapis, 2 caisses visibles, les autres sous le capot.
- Blocs `manut_*` : aller, saisir, poser, repeter, tantque (« tant qu'il y a une caisse ici »),
  sicaisse (« s'il y a une caisse ici … sinon », proposé partout où `tantque` l'est : sans lui, les
  élèves prenaient la boucle pour une condition), si (couleur).
- Optima 4, 12, 20, **14**, 6, 6, 8, 6, 6, 10, 12, 20. Niveau 4 : solution en 12, objectif assoupli de
  2 (champ `marge`, jugé trop dur à l'essai le 27/11/2026). Niveau 10 = tri à trois couleurs (`si`
  imbriqués). Départs aléatoires aux niveaux 6, 7 et 9 à 12. Pince : 5 positions de départ.

## Centre de tri (niveaux 13 à 18, `tri-moteur.js`, `tri.js`, `tri-3d.js`)

- Entrée (file) -> plateau 1 (droit, A, attente) -> plateau 2 (droit, B) -> C. Attente = pile de 4
  sans issue ; sorties de 6. Rien n'avance sans instruction.
- **Alignement obligatoire** : une caisse ne monte que sur un plateau aligné avec son tapis
  (entrer -> plateau 1 « droit » ; rappeler -> plateau 1 « attente » ; 1 -> 2 : plateau 2 « droit »).
- La valeur interne `droit` s'affiche **« le plateau 2 »** (plateau 1) ou **« la sortie C »**
  (plateau 2), jamais « tout droit » (demande de l'enseignant). La liste des directions dépend du
  plateau choisi (`DIRECTIONS` et extension `tri_directions` dans `tri.js`).
- Initialisation : 6 combinaisons d'orientations (`POSITIONS` « d1,d2 »). Optima 5, 9, 11, 12, 12, 20 ;
  départs aléatoires partout. Une seule attente inverse un ordre sans pouvoir le rétablir : ne pas
  créer de niveau qui l'exige.

## Bras pivotant et pivot sur rail (niveaux 19 à 27, `pivot-moteur.js`, `pivot.js`, `pivot-3d.js`)

- Design : `docs/superpowers/specs/2026-11-27-bras-pivotant-design.md`. `pivot-moteur.js` fabrique deux
  machines (`fabriquer`) : `Pivot` (sur place) et `Pivot.Rail` ; un « plan » associe « cran,orientation »
  au poste atteint. `pivot-3d.js` construit les deux scènes (toiles `c-pivot`, `c-rail`).
- Rotation par **quart de tour** ; pince et caisse restent alignées avec les tapis. « Il y a une caisse
  ici » regarde du côté visé, sorties comprises : dans une boucle, revenir face à l'entrée.
- Sur place : entrée ouest, sorties N, E, S (6). 4 départs ; bloc « répéter jusqu'à être face à
  l'ouest ». Pas de capot au tapis sud (il masquerait le bras). Optima 6, 7, 10, 12, 19 (minimum prouvé
  aux 19 et 20 ; 23 : meilleure solution connue).
- Sur rail : 3 crans ; entrée à l'ouest du cran 1 ; A, B, C au nord ; D à l'est du cran 3 ; attente (4,
  on y reprend) au sud du cran 2 ; ailleurs, saisir ou poser est une erreur. 12 départs ; blocs
  `pivot_glisser`, `pivot_jusquarail` (« face à l'ouest » / « au bout ouest du rail »). La pince se
  relève au-dessus de la pile d'attente (`levee`). Optima 9, 13, 15, 24 (recherche bornée, partielle).
  Caméra limitée par la hauteur (`max(29.5, 56 / aspect)`) : gagner de la hauteur agrandit la scène.
- Niveaux 19 à 27 : pas encore validés par l'enseignant (au 27/11/2026).

## Variables (niveaux 28 à 37, groupe « Variables », LVL6 ; 27/11/2026, demande de l'enseignant)

- Même bras sur rail (`machine` = « bras »), niveaux dans `M.VARIABLES` (`manutention-moteur.js`),
  ajoutés en fin de liste par `manutention.js`. Tests : `tests/variables.test.js`.
- Une ou plusieurs variables **nommées** par niveau (`variables: ["rouges", "bleues"]`). Blocs (style
  `variable`, bleu) : `manut_mettre`, `manut_ajouter`, `manut_retirer` (de N), `manut_tantquevar` et
  `manut_sivar` (comparaison `>` `<` `=` `≠` à un nombre), `manut_tantquevar2` et `manut_sivar2` (à une
  autre variable, champ `W` ; la boîte les propose avec les deux premières variables du niveau),
  `manut_repetervar` (« répéter [variable] fois », valeur lue au début de la boucle). Liste des noms : champ `field_variable_cody`,
  limité aux variables du niveau ouvert (toutes dans un espace caché, pour le PDF des solutions).
- Consignes et indices : `{nom}` marque une variable, affichée en `<var class="nom-var">` (italique, gras,
  bleu des blocs variable ; `A.riche`), accolades retirées dans le PDF (demande de l'enseignant).
- Chaque cas porte `vars` (valeurs au lancement) et, si contrôlées, `varsFin` (motif d'échec
  « variables » : « compteur vaut 9 au lieu de 5 »). Sauf celles listées dans `donnees` (niveaux 28, 30,
  32, 36 : la valeur est l'énoncé, affichée dans l'objectif « Départ : … »), la valeur de départ est quelconque (1 à 9) :
  il faut l'initialiser. « Rejouer au maximum » prend aussi les plus grandes valeurs des variables
  `donnees` (niveau 28 : nombre = 3). Valeurs dans le relevé, en titre de l'écran 3D (`vue.variables`) et en haut du 2D.
- Niveaux (optimum), **classés par difficulté** (27/11/2026, remarque de l'enseignant : l'ancien 35 était
  bien plus facile que le 34) : 28 commande en double (10 ; « répéter nombre fois », lire une variable) ;
  29 compter les caisses (8) ; 30 la commande (6) ; 31 deux piles (10) ; 32 piles sur mesure (2 variables
  données, 12) ; 33 rouges et bleues (2 variables, 11) ; 34 contrôle qualité (une sur trois, 11) ;
  35 autant de vertes (14 ; l'ordre de la sortie interdit d'alterner sans variable) ; 36 bon de commande
  (7 ; `commande` ne doit pas changer, ce qui interdit de la décompter) ; 37 couleur majoritaire (22 ;
  `retirer` et `sivar` absents de la boîte, sinon une seule variable « écart » suffisait).
  Reclassement : `manut-variables-ordre` déplace étoiles, programmes et niveau ouvert (`manutention.js`).
  Optima = solutions écrites, non prouvés minimaux. Départs aléatoires partout. Testés par l'enseignant
  le 27/11/2026 : piles sur mesure, autant de vertes (consigne reprise : « PUIS le MÊME nombre »),
  commande en double.

## Rendu 3D : règles et performances (27/11/2026)

- Les trois rendus **recopient matières et caisses** : reporter toute retouche dans les trois fichiers.
- Une scène n'est créée qu'à la première ouverture d'un niveau de sa machine (`moteur(nom)`).
- `Commun3D.fusionner(racine, mobiles)` fusionne les pièces fixes (une par matière) en fin de `creer`,
  et chaque caisse. **Toute nouvelle pièce qui bouge doit être ajoutée à `mobiles`** (sinon elle est
  figée dans le décor), ses sous-groupes mobiles aussi. Pièces plates au sol : sans ombre portée.
- Animation plafonnée à 60 images/s (30 en mode léger). Mesuré : le coût venait des appels de dessin
  (~800 par image) et des 4 scènes créées au chargement, pas des ombres ni de l'anticrénelage.
- **Mode léger** : rendu sans carte graphique détecté (SwiftShader, llvmpipe…), `?leger` ou
  `localStorage["cody-3d"] = "leger"` ; `?complet` l'interdit ; bascule automatique (`alleger`, une
  fois) sous ~22 images/s. Ombres PCF 1024, 30 images/s ; résolution, anticrénelage et filtrage gardés.
  **Ne pas descendre sous la résolution de l'écran** : à ×0,7, numéros des caisses illisibles.
- **Avertissement** `#alerte-3d` si le navigateur dessine sans carte graphique (`Commun3D.sansCarte`) :
  où activer l'accélération matérielle (cas réel : option coupée dans Chrome). « Fermer » : pour l'onglet.
  La console dit pourquoi le mode léger s'active.

## Export PDF et espace prof (27/11/2026)

- **PDF de l'élève** (bouton « PDF ») : image de ses blocs (thème clair, Luciole intégrée), atelier,
  numéro et nom du niveau, consigne, barème, nombre de blocs, adresse du jeu (lien), date.
- **Espace prof** (bouton « Prof ») : mot de passe, puis niveaux à cocher par groupe ; une page par
  solution (`prog` converti en blocs par `versBlocs`, dans `tortue.js` et `manutention.js`, une règle
  par machine). Création libre : « Pas de solution ». Accès retenu pour l'onglet (« cody-prof »).
  « Visualiser » affiche dans la fenêtre les solutions des niveaux cochés (images des blocs, sans PDF).
  « Appliquer la correction du niveau N » (deux clics) remplace le programme du niveau courant par la
  solution (option `appliquer(etat)` d'`Atelier.exports`) ; grisé en création libre.
- **Mot de passe** : seule son empreinte SHA-256 est dans le code (`EMPREINTE_PROF`, `atelier.js`) ;
  **ne jamais l'écrire en clair**. Pour le changer, remplacer l'empreinte. C'est un rideau, pas un verrou.
- Rendu : `Atelier.imageBlocs` charge l'état dans un espace Blockly caché (`.export-blocs`), copie le
  calque des blocs dans un SVG autonome (styles de la page + `defs`) puis sur une toile ; `export-pdf.js`
  compose des pages A4 à 150 ppp et écrit le PDF (image compressée sans perte par `CompressionStream`).

## Tests

- `node --test tests/*.test.js` : 288 tests (bras 103, tri 44, pivot 43, rail 37, variables 61) ; chaque solution
  modèle doit réussir avec `opt` blocs (moins `marge` s'il y en a).
- `tests/navigateur-*.js` (traçage, manutention, tri, pivot, rail) : à évaluer dans la page (console) ;
  ils construisent les solutions en blocs et relèvent les verdicts. **Ils écrasent les programmes
  sauvegardés** du navigateur utilisé.

## Pistes

- Niveau 23 plus dur que le 22 (aucune information sur la caisse : la place dans le programme sert de
  mémoire) : proposé de le réduire à une alternance nord / est ou de le rendre facultatif ; sans réponse.
- Retours des élèves sur le style et la difficulté des niveaux.
- Blocs à ajouter : compteur de boucle, variables au traçage, « aller à x y », formes toutes faites ; mode texte
  (Python) pour les plus avancés ; bras et tapis orientables (idée non conçue).
- Notation : score seulement, ou lien avec une compétence (C08 Coder) ?

## Intégration prévue dans PlayTP (rien n'est commencé)

Suivre le CLAUDE.md de PlayTP (« Nouveau bloc `:::` du format ») : `app/tp_format/blocks.py` (dataclass
`Tortue`) → `parser.py` (`_BLOCS`, `_valider_ouverture`, `_fermer`) → `templates/blocs/tortue.html`
(+ `blocs/papier/`) → styles dans `base.css` **et** `pdf.css` → `docs/CONVERSION_TP.md`. Déployer
l'appli avant de publier un TP qui l'utilise.

- **CSP stricte** (`style-src 'self'`) : Blockly depuis `app/static/js/vendor/`, `Blockly.inject(…,
  {css: false})` avec sa CSS dans un fichier ; garder l'interpréteur (jamais d'eval).
- **Anti-triche** : n'envoyer que le dessin modèle (segments calculés) ou les départs et objectifs,
  **jamais `prog`** ; c'est aussi ce qui rendrait l'espace prof vraiment protégé.
- **Réponse de l'élève** : nouveau type de champ (programme en JSON, réussite, nb de blocs), autosave,
  progression du sommaire (orange / vert). **PDF** : image du dessin final (comme `:::capture`).
- **Accessibilité** : Luciole, cibles ≥ 2,75 rem, couleurs dans les trois thèmes de `theme.css`.

Syntaxe envisagée (à arrêter) :

````markdown
:::tortue id=q3 depart="-50 -50 90" blocs="avancer|tourner|repeter" optimal=3
Fais tracer à la tortue un carré de 100 pas de côté.
:::
````

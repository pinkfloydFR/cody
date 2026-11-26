# Atelier technique et Manutention — plan de réalisation

> Exécution : en une session (superpowers:executing-plans).

**But :** rhabiller le traçage et ajouter l'atelier « Manutention ».
**Architecture :** deux pages (`index.html` = Traçage, `manutention.html`), les onglets sont des
liens. `js/atelier.js` regroupe le commun (thème Blockly, mémoire, verdict, barres de score) ;
`js/manutention-moteur.js` est pur (sans DOM), testable avec Node ; `js/manutention.js` est l'interface.
**Specs :** les deux fichiers de `docs/superpowers/specs/`.
**Sauvegarde :** pas de git ; copie de l'original dans `../tortue-maquette-avant-atelier/`.

## Contraintes
Luciole ; aucun JS ni style inline ; pas d'eval ; hors ligne ; clair et sombre ; cibles ≥ 2,75 rem ;
1920×1080 sans défilement pour programmer et exécuter ; rendu Blockly `thrasos` ; tutoiement ;
consignes en infinitif gras majuscule.

## À surveiller
- Programme sauvegardé avec l'ancienne maquette : doit se recharger.
- Boucle « tant que » vide ou sans effet : arrêt par limite, pas de gel.
- Changement de niveau ou « Réinitialiser » pendant une animation : tout s'arrête.
- Vitesse « mouvements réduits » : résultat identique, sans animation.
- Fenêtre moins haute que 1080 (barres du navigateur) : boutons toujours visibles.

## Tâche 1 — Habillage du traçage
`index.html`, `tortue.css`, `js/atelier.js`, `js/tortue.js`.
`window.Atelier = { memo, creerTheme(), injecter(id, boite), barres(note) -> Node, noter(n, opt) -> 1|2|3,
verdict(el, {etat:"ok"|"ko"|"info", titre, detail, note}), consigne(el, verbe, suite) }`.
Test : `tests/navigateur-tracage.js` (8 solutions → mêmes verdicts ; carré à 3 côtés refusé),
à passer avant et après.

## Tâche 2 — Moteur de manutention (test d'abord)
`js/manutention-moteur.js` (global `Manutention` + `module.exports`), `tests/manutention.test.js`.
- `NIVEAUX[i] = {titre, verbe, texte, indice, blocs, configs:[{depart, objectif}], prog, opt}` ;
  piles `{"1":[],"2":[],"3":[],"S":[]}`, bas → haut ; caisse `{l, c}` ; pince au départ en "1".
- Instructions : `{t:"aller",p}`, `{t:"saisir"}`, `{t:"poser"}`, `{t:"repeter",n,corps}`,
  `{t:"tantque",corps}`, `{t:"si",c,alors,sinon}`, avec `id` facultatif.
- `executer(prog, depart) -> {etat:{piles,pos,main}, trace:[{t,id,etat}], erreur:null|{code,id}}`,
  codes `saisir_vide`, `saisir_plein`, `poser_vide`, `poser_pleine`, `si_vide`, `limite` (500).
- `compter(prog) -> n` ; `verifier(niv, prog) -> {reussi, config, resultat, motif:null|"erreur"|"pince"|"piles"}`
  (`config` = première configuration en échec, 0 si réussi).
- `python(prog) -> string`.
Tests : chaque solution réussit avec `compter == opt` ; mauvais ordre et caisse tenue refusés ;
solutions « en dur » refusées aux niveaux 6 et 7 ; chaque code d'erreur ; `tantque` à corps vide → `limite`.
Commande : `node --test tests/manutention.test.js`.

## Tâche 3 — Interface Manutention
`manutention.html`, `js/manutention.js`, styles dans `tortue.css`, onglets dans les deux pages.
Mémoire : `manut-notes`, `manut-niveau`, `manut-prog-<n>`.
Test : `tests/navigateur-manutention.js` (7 solutions construites en blocs → conformes).

## Tâche 4 — Vérification et documentation
Console sans erreur, captures 1920×1080 clair et sombre, `CLAUDE.md` et `LISEZMOI.txt` à jour.

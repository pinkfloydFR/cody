/* À évaluer dans la page manutention.html : construit les solutions des niveaux 24 à 27 en blocs,
   les exécute à vitesse maximale et relève le verdict. */
(() => {
  const T = window.manutTest, B = window.Blockly, ws = T.ws, M = window.PivotRail;
  const bloc = (c) => {
    const b = { type: "pivot_" + c.t, fields: {}, inputs: {} };
    if (c.t === "tourner" || c.t === "glisser") b.fields.S = c.s;
    if (c.t === "jusqua") { b.type = "pivot_jusquarail"; b.fields.BUT = c.but || "ouest"; }
    if (c.t === "repeter") b.fields.N = c.n;
    if (c.t === "si") b.fields.C = c.c;
    for (const [nom, liste] of [["FAIRE", c.corps || c.alors], ["SINON", c.sinon]]) {
      if (liste && liste.length) b.inputs[nom] = { block: chaine(liste) };
    }
    return b;
  };
  const chaine = (l) => l.reduceRight((suite, c) => {
    const b = bloc(c);
    if (suite) b.next = { block: suite };
    return b;
  }, null);
  const essai = (i, prog) => {
    T.ouvrir(23 + i);
    ws.clear();
    const depart = { type: "manut_depart", x: 30, y: 30, deletable: false };
    if (prog.length) depart.next = { block: chaine(prog) };
    B.serialization.blocks.append(depart, ws);
    document.getElementById("vitesse").value = 5;
    document.getElementById("lancer").click();
    const texte = document.getElementById("verdict").innerText.replace(/\n+/g, " | ");
    window.Atelier.fermerFete();
    return `[${document.getElementById("compteur").textContent}] ${texte}`;
  };
  const res = {};
  M.NIVEAUX.forEach((n, i) => { res["niveau " + (24 + i)] = essai(i, n.prog); });
  const faceOuest = { t: "jusqua", but: "ouest", corps: [{ t: "tourner", s: "D" }] };
  const auBout = { t: "jusqua", but: "bout", corps: [{ t: "glisser", s: "O" }] };
  res["sans initialiser le cran"] = essai(0, M.NIVEAUX[0].prog.filter((_, k) => k !== 1));
  res["butée"] = essai(0, [faceOuest, auBout, { t: "glisser", s: "O" }]);
  res["rien de ce côté"] = essai(0, [faceOuest, auBout, { t: "saisir" }, { t: "tourner", s: "G" }, { t: "poser" }]);
  res.python = document.getElementById("code-python").textContent;
  res.releve = document.getElementById("releve").innerText.replace(/\n+/g, " ");
  res.en3D = T.en3D;
  return res;
})();

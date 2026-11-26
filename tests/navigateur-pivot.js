/* À évaluer dans la page manutention.html : construit les solutions des niveaux 19 à 23 en blocs,
   les exécute à vitesse maximale et relève le verdict. */
(() => {
  const T = window.manutTest, B = window.Blockly, ws = T.ws, M = window.Pivot;
  const bloc = (c) => {
    const b = { type: "pivot_" + c.t, fields: {}, inputs: {} };
    if (c.t === "tourner") b.fields.S = c.s;
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
    T.ouvrir(18 + i);
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
  M.NIVEAUX.forEach((n, i) => { res["niveau " + (19 + i)] = essai(i, n.prog); });
  res["sans initialisation"] = essai(1, M.NIVEAUX[1].prog.slice(1));
  res["saisir sur une sortie"] = essai(0, [{ t: "jusqua", corps: [{ t: "tourner", s: "D" }] }, { t: "tourner", s: "D" }, { t: "saisir" }]);
  res["boucle vide"] = essai(0, [{ t: "jusqua", corps: [] }]);
  res.python = document.getElementById("code-python").textContent;
  res.releve = document.getElementById("releve").innerText.replace(/\n+/g, " ");
  res.en3D = T.en3D;
  return res;
})();

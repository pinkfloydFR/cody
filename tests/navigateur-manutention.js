/* À évaluer dans la page manutention.html : construit chaque solution en blocs,
   l'exécute à vitesse maximale (sans animation) et relève le verdict. */
(() => {
  const T = window.manutTest, B = window.Blockly, ws = T.ws;
  const bloc = (c) => {
    const b = { type: "manut_" + c.t, fields: {}, inputs: {} };
    if (c.t === "aller") b.fields.P = c.p;
    if (c.t === "repeter") b.fields.N = c.n;
    if (c.t === "si") b.fields.C = c.c; /* « sicaisse » n'a pas de champ */
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
    T.ouvrir(i);
    ws.clear();
    const depart = { type: "manut_depart", x: 30, y: 30, deletable: false };
    if (prog.length) depart.next = { block: chaine(prog) };
    B.serialization.blocks.append(depart, ws);
    document.getElementById("vitesse").value = 5;
    document.getElementById("lancer").click();
    return [...document.querySelectorAll("#verdict strong, #verdict .verdict-textes span")]
      .map((e) => e.textContent).join(" | ");
  };
  const res = {};
  T.NIVEAUX.slice(0, 12).forEach((n, i) => { /* 13 à 18 : navigateur-tri.js */ res["niveau " + (i + 1)] = essai(i, n.prog); });
  res["vide"] = essai(0, []);
  res["sans initialisation"] = essai(0, T.NIVEAUX[0].prog.slice(1));
  res["saisie dans le vide"] = essai(0, [{ t: "aller", p: "2" }, { t: "saisir" }]);
  res["caisse tenue"] = essai(0, [{ t: "saisir" }]);
  res["en dur, niveau 6"] = essai(5, [T.NIVEAUX[4].prog[0], { t: "repeter", n: 3, corps: T.NIVEAUX[4].prog[1].corps }]);
  res.python = document.getElementById("code-python").textContent;
  return res;
})();

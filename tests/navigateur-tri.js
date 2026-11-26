/* À évaluer dans la page manutention.html : construit les solutions des niveaux 13 à 18 en blocs,
   les exécute à vitesse maximale et relève le verdict. */
(() => {
  const T = window.manutTest, B = window.Blockly, ws = T.ws, M = window.Tri;
  const bloc = (c) => {
    const b = { type: "tri_" + c.t, fields: {}, inputs: {} };
    if (c.t === "orienter") { b.fields.N = String(c.n); b.fields.D = c.d; }
    if (c.t === "envoyer") b.fields.N = String(c.n);
    if (c.t === "repeter") b.fields.N = c.n;
    if (c.t === "tantque" || c.t === "sicaisse") b.fields.O = c.ou;
    if (c.t === "si") { b.fields.N = String(c.n); b.fields.C = c.c; }
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
    T.ouvrir(12 + i);
    ws.clear();
    const depart = { type: "manut_depart", x: 30, y: 30, deletable: false };
    if (prog.length) depart.next = { block: chaine(prog) };
    B.serialization.blocks.append(depart, ws);
    document.getElementById("vitesse").value = 5;
    document.getElementById("lancer").click();
    return [...document.querySelectorAll("#verdict strong, #verdict .verdict-textes span")].map((e) => e.textContent).join(" | ");
  };
  const res = {};
  M.NIVEAUX.forEach((n, i) => { res["niveau " + (13 + i)] = essai(i, n.prog); });
  res["sans initialisation"] = essai(1, M.NIVEAUX[1].prog.slice(1));
  res["entrée sur plateau de travers"] = essai(0, [{ t: "orienter", n: 1, d: "attente" }, { t: "entrer" }]);
  res["entrée vide"] = essai(0, [{ t: "entrer" }, ...Array(7).fill({ t: "entrer" })]);
  res.releve = document.getElementById("releve").innerText.replace(/\n+/g, " ");
  return res;
})();

/* À évaluer dans la page index.html (console ou outil de test).
   Construit la solution de chaque niveau en blocs, l'exécute à vitesse maximale et relève le verdict. */
(async () => {
  /* Un onglet masqué suspend requestAnimationFrame : on le remplace pendant le test */
  window.requestAnimationFrame = (f) => { queueMicrotask(() => f(performance.now())); return 1; };
  const T = window.tortueTest, B = window.Blockly, ws = T.ws;
  const bloc = (c) => {
    if (c.rep) return { type: "tortue_repeter", fields: { N: c.rep }, inputs: { FAIRE: { block: chaine(c.corps) } } };
    if (c.t === "av") return { type: "tortue_avancer", fields: { N: c.d } };
    if (c.t === "tr") return { type: "tortue_tourner", fields: { S: c.a < 0 ? "D" : "G", A: Math.abs(c.a) } };
    if (c.t === "co") return { type: "tortue_couleur", fields: { C: c.c } };
    return { type: "tortue_stylo", fields: { E: c.bas ? "B" : "H" } };
  };
  const chaine = (l) => l.reduceRight((suite, c) => {
    const b = bloc(c);
    if (suite) b.next = { block: suite };
    return b;
  }, null);
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const lire = () => (document.getElementById("verdict") || document.getElementById("message")).textContent;
  const essai = async (i, prog) => {
    T.ouvrir(i);
    ws.clear();
    B.serialization.blocks.append({ type: "tortue_depart", x: 30, y: 30, deletable: false,
      next: { block: chaine(prog) } }, ws);
    document.getElementById("vitesse").value = 5;
    document.getElementById("lancer").click();
    for (let k = 0; k < 100 && document.getElementById("lancer").getAttribute("aria-pressed") === "true"; k++) await attendre(50);
    return lire().replace(/\s+/g, " ").trim();
  };
  const res = {};
  for (let i = 0; i < T.NIVEAUX.length; i++) {
    res["niveau " + (i + 1)] = await essai(i, T.NIVEAUX[i].prog || T.NIVEAUX[0].prog);
  }
  const faux = structuredClone(T.NIVEAUX[0].prog);
  faux[0].rep = 3;
  res["faux (3 côtés)"] = await essai(0, faux);
  /* niveaux « couleurs » : la même forme sans couleur, puis avec les couleurs échangées, doit être refusée */
  const sansCouleur = (p) => p.filter((c) => c.t !== "co").map((c) => (c.rep ? { ...c, corps: sansCouleur(c.corps) } : c));
  const echanger = (p) => {
    const ordre = [];
    const voir = (l) => l.forEach((c) => (c.rep ? voir(c.corps) : c.t === "co" && !ordre.includes(c.c) && ordre.push(c.c)));
    voir(p);
    const autre = (c) => ordre[(ordre.indexOf(c) + 1) % ordre.length];
    const changer = (l) => l.map((c) => (c.rep ? { ...c, corps: changer(c.corps) } : c.t === "co" ? { ...c, c: autre(c.c) } : c));
    return ordre.length > 1 ? changer(p) : null;
  };
  for (let i = 0; i < T.NIVEAUX.length; i++) {
    const n = T.NIVEAUX[i];
    if (!n.couleurs) continue;
    res[`niveau ${i + 1} sans couleur`] = await essai(i, sansCouleur(n.prog));
    const faux = echanger(n.prog);
    if (faux) res[`niveau ${i + 1} couleurs échangées`] = await essai(i, faux);
  }
  res.python = document.getElementById("code-python").textContent;
  return res;
})();

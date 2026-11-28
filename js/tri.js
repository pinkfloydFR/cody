/* Centre de tri : blocs, géométrie, dessin 2D, objectif et textes. L'interface commune est dans
   manutention.js ; les règles sont dans tri-moteur.js. */
{
  const B = window.Blockly, M = window.Tri;

  /* ---------- Blocs ---------- */
  const lien = { previousStatement: null, nextStatement: null };
  const corps = (name) => ({ type: "input_statement", name });
  const liste = (name, options) => ({ type: "field_dropdown", name, options });
  const PLATEAUX = () => liste("N", [["1", "1"], ["2", "2"]]);
  const OU = () => liste("O", [["à l'entrée", "entree"], ["en attente", "attente"]]);
  /* Directions proposées selon le plateau. La valeur « droit » est gardée dans les programmes, mais
     elle porte le nom de ce qui est au bout : le plateau 2 ou la sortie C (demande de l'enseignant). */
  const DIRECTIONS = {
    1: [["la sortie A", "A"], ["le plateau 2", "droit"], ["l'attente", "attente"]],
    2: [["la sortie C", "droit"], ["la sortie B", "B"]],
  };
  function directions() {
    const bloc = this && this.getSourceBlock && this.getSourceBlock();
    return DIRECTIONS[(bloc && (bloc.plateau || bloc.getFieldValue("N"))) || "1"];
  }
  /* Quand on change de plateau, la liste et le nom affiché suivent */
  B.Extensions.register("tri_directions", function () {
    const bloc = this;
    bloc.getField("N").setValidator((plateau) => {
      bloc.plateau = plateau;
      const champ = bloc.getField("D"), avant = champ.getValue();
      if (champ.getOptions(false).some((o) => o[1] === avant)) {
        champ.doValueUpdate_(avant); /* même valeur, autre nom */
        champ.forceRerender();
      } else champ.setValue("droit");
      return plateau;
    });
  });
  B.defineBlocksWithJsonArray([
    { type: "tri_entrer", message0: "faire entrer la caisse suivante", ...lien, style: "stylo" },
    { type: "tri_orienter", message0: "orienter le plateau %1 vers %2", args0: [PLATEAUX(),
      liste("D", directions)], extensions: ["tri_directions"], ...lien, style: "mouvement" },
    { type: "tri_envoyer", message0: "envoyer la caisse du plateau %1", args0: [PLATEAUX()], ...lien, style: "stylo" },
    { type: "tri_rappeler", message0: "rappeler une caisse de l'attente", ...lien, style: "stylo" },
    { type: "tri_repeter", message0: "répéter %1 fois %2 %3", args0: [
      { type: "field_number", name: "N", value: 3, min: 0, max: 100, precision: 1 }, { type: "input_dummy" }, corps("FAIRE")],
      ...lien, style: "boucle" },
    { type: "tri_tantque", message0: "répéter tant qu'une caisse attend %1 %2 %3",
      args0: [OU(), { type: "input_dummy" }, corps("FAIRE")], ...lien, style: "tantque" },
    { type: "tri_sicaisse", message0: "s'il y a une caisse %1 %2 %3", args0: [OU(), { type: "input_dummy" }, corps("FAIRE")],
      message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
    { type: "tri_si", message0: "si la caisse du plateau %1 est %2 %3 %4", args0: [PLATEAUX(),
      liste("C", [["rouge", "rouge"], ["bleue", "bleu"], ["jaune", "jaune"], ["verte", "vert"]]),
      { type: "input_dummy" }, corps("FAIRE")], message1: "sinon %1", args1: [corps("SINON")], ...lien, style: "condition" },
  ]);
  /* Explications au survol des blocs (débutants) */
  window.Atelier.expliquer({
    tri_entrer: "La caisse suivante de l'entrée monte sur le plateau 1. Il doit être tourné vers **le plateau 2** (aligné avec l'entrée).",
    tri_orienter: "Tourne le plateau choisi. Une caisse ne passe que si le plateau est **aligné** avec le tapis où elle va.",
    tri_envoyer: "La caisse du plateau part du côté où il est tourné.",
    tri_rappeler: "La caisse du dessus de l'attente revient sur le plateau 1. Il doit être tourné vers **l'attente**.",
    tri_repeter: window.Atelier.TEXTE_REPETER,
    tri_tantque: "Répète les blocs rangés **DEDANS** tant qu'une caisse attend à l'endroit choisi. La question est posée avant chaque tour.",
    tri_sicaisse: "Pose la question **UNE seule fois** : si la réponse est oui, fait les blocs du haut ; sinon, ceux de « sinon ».",
    tri_si: "Regarde la couleur de la caisse du plateau, **une seule fois** : si c'est celle-là, fait les blocs du haut ; sinon, ceux de « sinon ».",
  });

  function compiler(b) {
    const out = [];
    for (; b; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const t = b.type.slice("tri_".length), c = { t, id: b.id }, v = (n) => b.getFieldValue(n);
      const dedans = (nom) => compiler(b.getInputTargetBlock(nom));
      if (t === "orienter") { c.n = +v("N"); c.d = v("D"); }
      else if (t === "envoyer") c.n = +v("N");
      else if (t === "repeter") { c.n = +v("N"); c.corps = dedans("FAIRE"); }
      else if (t === "tantque") { c.ou = v("O"); c.corps = dedans("FAIRE"); }
      else if (t === "sicaisse") { c.ou = v("O"); c.alors = dedans("FAIRE"); c.sinon = dedans("SINON"); }
      else if (t === "si") { c.n = +v("N"); c.c = v("C"); c.alors = dedans("FAIRE"); c.sinon = dedans("SINON"); }
      out.push(c);
    }
    return out;
  }

  /* ---------- Géométrie commune au 2D et à la 3D (unités de la scène, vue de dessus : x, z) ---------- */
  const P1 = -3.6, P2 = 3.9;
  const cle = (c) => c.l + "-" + c.c;
  /* Place de chaque caisse ; « cachee » : sous un capot */
  function places(e) {
    const m = new Map();
    const poser = (c, x, z, cachee = false) => m.set(cle(c), { c, x, z, cachee });
    e.entree.forEach((c, i) => poser(c, P1 - 2.95 - i * 2.05, 0, i > 2));
    if (e.p1) poser(e.p1, P1, 0);
    if (e.p2) poser(e.p2, P2, 0);
    for (const [voie, x] of [["A", P1], ["B", P2]]) {
      e[voie].forEach((c, i) => { const r = e[voie].length - 1 - i; poser(c, x, -2.9 - r * 1.65, r > 2); });
    }
    e.C.forEach((c, i) => { const r = e.C.length - 1 - i; poser(c, P2 + 2.95 + r * 2.05, 0, r > 2); });
    e.attente.forEach((c, i) => poser(c, P1, 7.0 - i * 1.45));
    return m;
  }
  const ANGLE = { droit: 0, A: -Math.PI / 2, B: -Math.PI / 2, attente: Math.PI / 2 };
  const AU_BOUT = { 1: "vers le plateau 2", 2: "vers la sortie C" };
  const AUTRES = { A: "vers la sortie A", B: "vers la sortie B", attente: "vers l'attente" };
  const vers = (n, d) => (d === "droit" ? AU_BOUT[n] : AUTRES[d]);

  const fixe = (etat) => ({ tri: true, caisses: [...places(etat).values()], angles: [ANGLE[etat.dir[1]], ANGLE[etat.dir[2]]],
    instruction: "en attente" });

  function libelle(ev) {
    const c = ev.instruction;
    if (c.t === "entrer") return "faire entrer la caisse";
    if (c.t === "rappeler") return "rappeler de l'attente";
    if (c.t === "envoyer") return `envoyer le plateau ${c.n}`;
    return `plateau ${c.n} ${vers(c.n, c.d)}`;
  }
  /* Image intermédiaire : chaque caisse glisse de son ancienne place à la nouvelle, les plateaux tournent */
  function image(avant, ev, u) {
    const k = u * u * (3 - 2 * u), a = places(avant), b = places(ev.etat), mix = (x, y) => x + (y - x) * k;
    const caisses = [...b].map(([id, fin]) => {
      const debut = a.get(id) || fin;
      return { c: fin.c, x: mix(debut.x, fin.x), z: mix(debut.z, fin.z), cachee: debut.cachee && fin.cachee };
    });
    return { tri: true, caisses, instruction: libelle(ev),
      angles: [1, 2].map((n) => mix(ANGLE[avant.dir[n]], ANGLE[ev.etat.dir[n]])) };
  }

  const etatDepart = (cas, position) => {
    const [d1, d2] = position.split(",");
    return { entree: [...cas.depart.entree], attente: [], A: [], B: [], C: [], p1: null, p2: null, dir: { 1: d1, 2: d2 } };
  };

  /* ---------- Dessin 2D de secours : le centre vu de dessus (toile logique 1200 x 500) ---------- */
  const COULEURS = { bleu: ["#2b5c9c", "bleue"], rouge: ["#a8342a", "rouge"], jaune: ["#836400", "jaune"], vert: ["#2a6b43", "verte"] };
  const E = 30, X = (x) => 600 + x * E, Z = (z) => 248 + z * E;
  function texte(g, t, x, y, taille, couleur, gras = true) {
    g.fillStyle = couleur; g.font = `${gras ? "bold " : ""}${taille}px Luciole, system-ui, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, x, y);
  }
  function carre(g, x, y, c, l, h) {
    const [teinte, nom] = COULEURS[c.c];
    g.fillStyle = teinte; g.fillRect(x - l / 2, y - h / 2, l, h);
    texte(g, c.l, x, y - h * .14, h * .52, "#fff");
    texte(g, nom, x, y + h * .3, h * .26, "#fff", false);
  }
  function dessin2D(g, vue, t) {
    g.fillStyle = t.fond; g.fillRect(0, 0, 1200, 500);
    const voie = (x0, z0, x1, z1) => { g.fillStyle = t.sol; g.fillRect(X(Math.min(x0, x1)) - (x0 === x1 ? 27 : 0), Z(Math.min(z0, z1)) - (z0 === z1 ? 27 : 0),
      x0 === x1 ? 54 : Math.abs(x1 - x0) * E, z0 === z1 ? 54 : Math.abs(z1 - z0) * E); };
    voie(-12.4, 0, 12.4, 0); voie(P1, -7.6, P1, 0); voie(P2, -7.6, P2, 0); voie(P1, 0, P1, 7.9);
    [P1, P2].forEach((x, i) => {
      g.beginPath(); g.arc(X(x), Z(0), 50, 0, Math.PI * 2); g.fillStyle = t.acier; g.fill();
      g.save(); g.translate(X(x), Z(0)); g.rotate(vue.angles[i]);
      g.fillStyle = "#ffb800"; g.beginPath();
      [[34, -10], [66, -10], [66, -26], [100, 0], [66, 26], [66, 10], [34, 10]].forEach(([a, b], j) => (j ? g.lineTo(a, b) : g.moveTo(a, b)));
      g.fill(); g.restore();
      texte(g, `plateau ${i + 1}`, X(x) + 96, Z(0) + 56, 18, t.texte);
    });
    g.fillStyle = "#e0a81e"; g.fillRect(X(P1) - 30, Z(7.9), 60, 8);
    texte(g, "ENTRÉE", X(-9.4), Z(1.7), 20, t.texte);
    texte(g, "SORTIE C", X(9.6), Z(-1.7), 20, t.texte);
    texte(g, "SORTIE A", X(P1) - 90, Z(-6.8), 20, t.texte);
    texte(g, "SORTIE B", X(P2) + 90, Z(-6.8), 20, t.texte);
    texte(g, "ATTENTE", X(P1) - 90, Z(5.4), 20, t.texte);
    for (const o of vue.caisses) if (!o.cachee) carre(g, X(o.x), Z(o.z), o.c, 52, 42);
    for (const x of [-12.4, 12.4]) { g.fillStyle = t.acier; g.fillRect(X(x) - 24, Z(0) - 36, 48, 72); }
  }

  /* Vignette « Objectif » (600 x 255) : une ligne par sortie, première arrivée à gauche */
  function objectif(g, cas, t) {
    g.fillStyle = t.fond; g.fillRect(0, 0, 600, 255);
    ["A", "B", "C"].forEach((s, i) => {
      const y = 44 + i * 74;
      texte(g, "SORTIE " + s, 78, y, 24, t.texte);
      g.fillStyle = t.sol; g.fillRect(160, y + 30, 424, 4);
      if (!cas.objectif[s].length) texte(g, "rien", 196, y, 20, t.texte, false);
      cas.objectif[s].forEach((c, j) => carre(g, 192 + j * 70, y, c, 62, 54));
    });
  }

  /* ---------- Relevé et messages ---------- */
  const COURT = { A: "vers A", B: "vers B", attente: "vers attente" };
  const court = (n, d) => (d === "droit" ? { 1: "vers plateau 2", 2: "vers C" }[n] : COURT[d]);
  const releve = (e) => [["plateau 1", court(1, e.dir[1])], ["plateau 2", court(2, e.dir[2])], ["en attente", e.attente.length],
    ["livrées", ["A", "B", "C"].map((s) => s + " : " + (e[s].map((c) => c.l).join(" ") || "—")).join("   ")]];
  const depuis = (p) => { const [a, b] = p.split(","); return `plateau 1 ${vers(1, a)}, plateau 2 ${vers(2, b)}`; };

  window.KitTri = {
    prefixe: "tri_", moteur: M, compiler, etatDepart, fixe, image, libelle, dessin2D, objectif, releve,
    attente: () => "Les caisses et l'orientation des plateaux au départ sont tirées au hasard. Ton programme est aussi vérifié sur d'autres départs.",
    enCours: (p) => `Au départ : ${depuis(p)}.`,
    defaut: (bonne, mauvaise) => `Ton programme réussit quand les plateaux démarrent ainsi : ${depuis(bonne)}. Mais pas ainsi : ${depuis(mauvaise)}. Oriente-les toi-même.`,
    echec: (motif) => (motif === "reste" ? "une caisse n'est pas partie : il en reste à l'entrée, sur un plateau ou en attente."
      : "les sorties ne correspondent pas à l'objectif."),
    verifie: " · vérifié avec toutes les orientations de départ et sur plusieurs arrivages",
    succes: "toutes les orientations de départ",
  };
}

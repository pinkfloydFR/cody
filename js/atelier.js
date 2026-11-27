/* Parties communes aux deux ateliers (Traçage et Manutention). */
{
  const B = window.Blockly;
  const sombre = matchMedia("(prefers-color-scheme: dark)");

  const memo = {
    lire(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    ecrire(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* navigation privée */ } },
  };

  /* Couleurs de blocs : texte blanc, contraste d'au moins 4,5 */
  const style = (p, s, t) => ({ colourPrimary: p, colourSecondary: s, colourTertiary: t });
  const STYLES = {
    depart: style("#3d4b5f", "#5b6b81", "#2a3546"),
    mouvement: style("#0e6b78", "#3f8f9a", "#084952"),
    boucle: style("#9a5b0b", "#bd8238", "#693d05"),
    tantque: style("#3d7128", "#659650", "#274c18"),
    condition: style("#a32f63", "#c25a88", "#701e43"),
    stylo: style("#5d4e8c", "#8071ab", "#3f3463"),
  };
  const fabriquer = (nom, fond, boite, barre, texte) => B.Theme.defineTheme(nom, {
    base: B.Themes.Classic,
    startHats: false,
    blockStyles: STYLES,
    componentStyles: {
      workspaceBackgroundColour: fond, flyoutBackgroundColour: boite, flyoutOpacity: 1,
      toolboxBackgroundColour: boite, scrollbarColour: barre, flyoutForegroundColour: texte,
    },
    fontStyle: { family: "Luciole, system-ui, sans-serif", weight: "normal", size: 12 },
  });
  const THEME_CLAIR = fabriquer("atelier-clair", "#fbfcfd", "#e8ecf1", "#aab4c2", "#1c2532");
  const THEME_SOMBRE = fabriquer("atelier-sombre", "#161c25", "#222b37", "#4a576a", "#e5eaf1");
  const theme = () => (sombre.matches ? THEME_SOMBRE : THEME_CLAIR);

  /* Rendu « cody » : thrasos, avec en plus une prise femelle au fond des boucles et des conditions.
     Thrasos laisse ce fond plat : le picot du dernier bloc flottait, entouré d'un vide.
     (Reprend Drawer.drawStatementInput_ de Blockly 13.5 : à revérifier si Blockly est mis à jour.) */
  class DessinCody extends B.blockRendering.Drawer {
    drawStatementInput_(ligne) {
      const entree = ligne.getLastInput();
      const suite = entree && entree.connectedBlock;
      /* Sans bloc à picot dans la boucle, le dessin d'origine convient */
      if (!suite || !suite.lastConnectionInStack(false)) { super.drawStatementInput_(ligne); return; }
      const c = this.constants_, trait = B.utils.svgPaths.lineOnAxis, coins = c.INSIDE_CORNERS;
      const x = entree.xPos + entree.notchOffset + entree.shape.width;
      const hautGauche = entree.shape.pathRight + trait("h", -(entree.notchOffset - coins.width)) + coins.pathTop;
      /* Le fond remonte de la hauteur du picot, puis redescend autour de lui */
      const hauteur = ligne.height - 2 * coins.height - c.NOTCH_HEIGHT;
      this.outlinePath_ += trait("H", x) + hautGauche + trait("v", hauteur) + coins.pathBottom +
        trait("H", x - entree.shape.width) + c.NOTCH.pathLeft + trait("H", ligne.xPos + ligne.width);
      this.positionStatementInputConnection_(ligne);
    }
  }
  class RenduCody extends B.thrasos.Renderer {
    makeDrawer_(bloc, info) { return new DessinCody(bloc, info); }
  }
  B.blockRendering.register("cody", RenduCody);

  /* « echelle » : taille de départ des blocs (manutention un peu plus petite : la scène 3D a besoin de place) */
  /* Pas de marge au-dessus ni à gauche du programme : les ascenseurs ne vont que vers la droite et
     le bas (demande de l'enseignant). Un bloc posé plus haut ou plus à gauche reste atteignable. */
  class MetriquesCody extends B.MetricsManager {
    getPaddedContent_(vue, contenu) {
      const p = super.getPaddedContent_(vue, contenu);
      p.top = Math.min(0, contenu.top);
      p.left = Math.min(0, contenu.left);
      p.bottom = Math.max(p.bottom, p.top + vue.height);
      p.right = Math.max(p.right, p.left + vue.width);
      return p;
    }
  }

  /* Au chargement d'un programme : DÉPART (et le reste avec lui) en haut à gauche, vue au début */
  function cadrer(ws) {
    const MARGE = 16, blocs = ws.getTopBlocks(false);
    if (blocs.length) {
      const r = ws.getBlocksBoundingBox(), dx = MARGE - r.left, dy = MARGE - r.top;
      if (dx || dy) {
        B.Events.disable();
        try { for (const b of blocs) b.moveBy(dx, dy); } finally { B.Events.enable(); }
      }
    }
    const m = ws.getMetrics();
    ws.scroll(-m.scrollLeft, -m.scrollTop);
  }

  function injecter(id, boite, echelle = 1.1) {
    const ws = B.inject(id, {
      toolbox: boite, renderer: "cody", theme: theme(), media: "media/", trashcan: true,
      sounds: false, /* aucun son : en classe, cela devient vite pénible (demande de l'enseignant) */
      zoom: { controls: true, wheel: false, startScale: echelle, maxScale: 2, minScale: 0.5 },
      move: { scrollbars: true, drag: true, wheel: true },
      plugins: { metricsManager: MetriquesCody },
    });
    ws.addChangeListener(B.Events.disableOrphans);
    new ResizeObserver(() => B.svgResize(ws)).observe(document.getElementById(id));
    sombre.addEventListener("change", () => ws.setTheme(theme()));
    return ws;
  }

  const noter = (n, opt) => (n <= opt ? 3 : n <= opt + 2 ? 2 : 1);

  const creer = (balise, classe, texte) => {
    const e = document.createElement(balise);
    if (classe) e.className = classe;
    if (texte !== undefined) e.textContent = texte;
    return e;
  };

  /* Score : 3 étoiles */
  function etoiles(note) {
    const b = creer("span", "etoiles");
    b.setAttribute("role", "img");
    b.setAttribute("aria-label", `score ${note} sur 3`);
    for (let i = 1; i <= 3; i++) {
      const e = creer("i", i <= note ? "pleine" : "", "★");
      e.setAttribute("aria-hidden", "true");
      b.append(e);
    }
    return b;
  }

  /* Barème affiché sous l'objectif : mêmes seuils que « noter » */
  function bareme(el, opt) {
    el.hidden = !opt;
    if (!opt) return;
    const ligne = (note, texte) => {
      const li = creer("li");
      li.append(etoiles(note), creer("span", "", texte));
      return li;
    };
    el.replaceChildren(ligne(3, `${opt} blocs max.`), ligne(2, `${opt + 1} à ${opt + 2}`), ligne(1, `${opt + 3} et plus`));
  }

  function verdict(el, { etat = "info", titre, detail = "", note = 0 }) {
    el.className = "verdict " + etat;
    const textes = creer("div", "verdict-textes");
    textes.append(creer("strong", "", titre), creer("span", "", detail));
    el.replaceChildren(textes, ...(note ? [etoiles(note)] : []));
  }

  /* Consigne : verbe à l'infinitif en gras et en majuscules */
  const consigne = (el, verbe, suite) => el.replaceChildren(creer("strong", "", verbe), " " + suite);

  /* Un bouton de niveau ; « complet » : avec son titre, pour une ligne de menu */
  function boutonNiveau(n, i, courant, notes, ouvrir, complet) {
    const b = creer("button", complet ? "menu-niveau" : "niv");
    b.type = "button";
    const note = notes[i] || 0;
    b.setAttribute("aria-label", `Niveau ${i + 1} : ${n.titre}${note ? `, score ${note} sur 3` : ""}`);
    if (!complet) b.title = n.titre;
    if (i === courant) b.setAttribute("aria-current", "true");
    const s = etoiles(note);
    s.setAttribute("aria-hidden", "true");
    b.append(creer("span", complet ? "menu-numero" : "", String(i + 1)));
    if (complet) b.append(creer("span", "menu-titre", n.titre));
    b.append(s);
    b.addEventListener("click", () => ouvrir(i));
    return b;
  }

  /* Niveaux regroupés (champ « groupe ») : un menu déroulant par groupe ; sinon une rangée de boutons */
  function boutonsNiveaux(nav, niveaux, courant, notes, ouvrir) {
    if (!niveaux[0].groupe) {
      nav.replaceChildren(...niveaux.map((n, i) => boutonNiveau(n, i, courant, notes, ouvrir, false)));
      return;
    }
    const groupes = new Map();
    niveaux.forEach((n, i) => {
      if (!groupes.has(n.groupe)) groupes.set(n.groupe, []);
      groupes.get(n.groupe).push(i);
    });
    nav.replaceChildren(...[...groupes].map(([nom, indices]) => {
      const menu = creer("details", "menu"), titre = creer("summary"), liste = creer("div", "menu-liste");
      menu.name = "niveaux"; /* un seul menu ouvert à la fois */
      const ici = indices.includes(courant);
      if (ici) menu.classList.add("menu-courant");
      const gagnees = indices.reduce((t, i) => t + (notes[i] || 0), 0);
      titre.append(creer("span", "menu-nom", ici ? `${nom} · niveau ${courant + 1}` : nom),
        creer("span", "menu-score", `★ ${gagnees}/${indices.length * 3}`));
      liste.append(...indices.map((i) => boutonNiveau(niveaux[i], i, courant, notes, (k) => { menu.open = false; ouvrir(k); }, true)));
      menu.append(titre, liste);
      return menu;
    }));
  }

  /* Un menu ouvert se ferme au clic ailleurs et avec Échap */
  document.addEventListener("click", (e) => {
    for (const m of document.querySelectorAll("details.menu[open]")) if (!m.contains(e.target)) m.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    for (const m of document.querySelectorAll("details.menu[open]")) { m.open = false; m.querySelector("summary").focus(); }
  });

  /* Bouton qui efface : un premier clic demande confirmation (4 s), le second agit.
     Rend la fonction qui annule la demande (à appeler en changeant de niveau). */
  function boutonConfirmer(bouton, action) {
    const texte = bouton.querySelector("span"), normal = texte.textContent;
    let attente = 0;
    const annuler = () => {
      clearTimeout(attente);
      attente = 0;
      texte.textContent = normal;
      bouton.classList.remove("a-confirmer");
    };
    bouton.addEventListener("click", () => {
      if (attente) { annuler(); action(); return; }
      texte.textContent = "Confirmer : effacer le code ?";
      bouton.classList.add("a-confirmer");
      attente = setTimeout(annuler, 4000);
    });
    return annuler;
  }

  function boutonCopier(bouton, source) {
    bouton.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(source.textContent); bouton.textContent = "Copié"; }
      catch { bouton.textContent = "Copie impossible"; }
      setTimeout(() => { bouton.textContent = "Copier"; }, 1600);
    });
  }

  /* Indice : bouton « ? » à droite du titre du niveau ; le texte s'ouvre dans une fenêtre au milieu
     de l'écran (Échap, « Compris » ou un clic à côté la ferment). Rend la fonction qui change le texte. */
  function boutonIndice(bouton) {
    const fenetre = creer("dialog", "indice-fenetre"), carte = creer("div", "indice-carte");
    const texte = creer("p"), ok = creer("button", "btn btn-go", "Compris");
    const titre = creer("h2", "", "Un indice");
    titre.id = "indice-titre";
    fenetre.setAttribute("aria-labelledby", "indice-titre");
    ok.type = "button";
    ok.addEventListener("click", () => fenetre.close());
    fenetre.addEventListener("click", (e) => { if (e.target === fenetre) fenetre.close(); });
    carte.append(titre, texte, ok);
    fenetre.append(carte);
    document.body.append(fenetre);
    bouton.addEventListener("click", () => fenetre.showModal());
    return (t) => {
      texte.textContent = t || "";
      bouton.hidden = !t;
      if (fenetre.open) fenetre.close();
    };
  }

  function boutonExecuter(bouton, enCours) {
    bouton.setAttribute("aria-pressed", enCours ? "true" : "false");
    bouton.querySelector("span").textContent = enCours ? "Arrêter" : "Exécuter";
    bouton.querySelector("path").setAttribute("d", enCours ? "M6 6h12v12H6z" : "M7 4.5v15l12.5-7.5z");
  }

  /* ---------- Écran de réussite : grandes étoiles, feu d'artifice, deux boutons ----------
     Comme l'animation du bras, il ignore « mouvements réduits » (demandé par l'enseignant, et
     le réglage Windows de son poste l'aurait masqué). Échap le ferme. */
  let fenetre = null, attenteFete = 0, image = 0;

  function fermerFete() {
    clearTimeout(attenteFete);
    cancelAnimationFrame(image);
    if (fenetre) { const f = fenetre; fenetre = null; if (f.open) f.close(); f.remove(); }
  }

  function artifice(toile, salves) {
    const g = toile.getContext("2d");
    const l = (toile.width = innerWidth), h = (toile.height = innerHeight);
    const tons = ["#ffd23f", "#ff7a45", "#5fc8d4", "#7ee08a", "#e46aa6", "#ffffff"];
    let eclats = [], prochaine = 0, lancees = 0, debut = null, dernier = null;
    const exploser = () => {
      const x = l * (0.2 + 0.6 * Math.random()), y = h * (0.18 + 0.35 * Math.random());
      const ton = tons[lancees % tons.length];
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * Math.PI * 2, v = 90 + Math.random() * 330;
        eclats.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 1, c: i % 5 ? ton : "#ffffff" });
      }
    };
    const dessiner = (t) => {
      if (debut === null) debut = dernier = t;
      const pas = Math.min((t - dernier) / 1000, 0.05);
      dernier = t;
      if (lancees < salves && t - debut >= prochaine) { exploser(); lancees++; prochaine += 330; }
      g.clearRect(0, 0, l, h);
      g.lineCap = "round"; g.lineWidth = 3.5;
      for (const e of eclats) {
        e.vx *= 1 - 1.7 * pas; e.vy = e.vy * (1 - 1.7 * pas) + 190 * pas;
        e.x += e.vx * pas; e.y += e.vy * pas; e.vie -= 0.65 * pas;
        g.globalAlpha = Math.max(e.vie, 0); g.strokeStyle = e.c;
        g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x - e.vx * 0.04, e.y - e.vy * 0.04); g.stroke();
      }
      g.globalAlpha = 1;
      eclats = eclats.filter((e) => e.vie > 0);
      if (lancees < salves || eclats.length) image = requestAnimationFrame(dessiner);
    };
    image = requestAnimationFrame(dessiner);
  }

  /* actions : { retenter(), maximum(), suivant() } ; « maximum » seulement quand le nombre de
     caisses varie, « suivant » absent au dernier niveau */
  function feter(note, detail, { retenter, maximum, suivant }, delai = 700) {
    fermerFete();
    attenteFete = setTimeout(() => {
      const f = creer("dialog", "fete"), carte = creer("div", "fete-carte"), toile = creer("canvas");
      toile.setAttribute("aria-hidden", "true");
      const bouton = (classe, texte, action) => {
        const b = creer("button", "btn " + classe, texte);
        b.type = "button";
        b.addEventListener("click", () => { fermerFete(); action(); });
        return b;
      };
      const boutons = creer("div", "fete-boutons");
      boutons.append(bouton("btn-sec", "Retenter", retenter));
      if (maximum) boutons.append(bouton("btn-sec", "Rejouer au maximum", maximum));
      if (suivant) boutons.append(bouton("btn-go", "Niveau suivant", suivant));
      const titre = creer("h2", "", note === 3 ? "Bravo !" : "Réussi !");
      titre.id = "fete-titre";
      f.setAttribute("aria-labelledby", titre.id);
      carte.append(etoiles(note), titre, creer("p", "", detail), boutons);
      f.append(carte, toile);
      f.addEventListener("close", () => { if (fenetre === f) fermerFete(); });
      f.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); fermerFete(); } });
      document.body.append(f);
      fenetre = f;
      f.showModal();
      boutons.lastElementChild.focus();
      artifice(toile, [0, 2, 4, 7][note]);
    }, delai);
  }

  window.Atelier = { memo, sombre, injecter, noter, creer, etoiles, bareme, feter, fermerFete, verdict, consigne, boutonsNiveaux, boutonConfirmer, boutonCopier, boutonIndice, boutonExecuter, cadrer };
}

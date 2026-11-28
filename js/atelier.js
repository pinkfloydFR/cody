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
    variable: style("#2457a6", "#5079bd", "#173d78"),
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
  /* Bloc où le programme s'est arrêté : cadre rouge clignotant (demande de l'enseignant).
     null : retire la marque. La marque tient tant que le bloc existe ; elle part au prochain essai,
     au changement de niveau ou dès que le programme est modifié. */
  const fautifs = new WeakMap();
  function marquerErreur(ws, id) {
    const avant = fautifs.get(ws);
    if (avant) { const r = avant.getSvgRoot && avant.getSvgRoot(); if (r) r.classList.remove("bloc-fautif"); }
    fautifs.delete(ws);
    const bloc = id && ws.getBlockById(id);
    if (!bloc) return;
    bloc.getSvgRoot().classList.add("bloc-fautif");
    fautifs.set(ws, bloc);
    if (!ws.codyFautif) {
      ws.codyFautif = true;
      ws.addChangeListener((e) => { if (!e.isUiEvent && fautifs.has(ws)) marquerErreur(ws, null); });
    }
  }

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
  /* Texte de consigne ou d'indice : « {nom} » désigne une variable, mise à part (<var> : italique,
     couleur ; demande de l'enseignant). « sansMarques » : le même texte sans accolades (PDF). */
  const riche = (texte) => (texte || "").split(/\{(\w+)\}/).map((bout, i) => (i % 2 ? creer("var", "nom-var", bout) : bout));
  const sansMarques = (texte) => (texte || "").replace(/\{(\w+)\}/g, "$1");
  const consigne = (el, verbe, suite) => el.replaceChildren(creer("strong", "", verbe), " ", ...riche(suite));

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
    /* Bouton court « LVL1 », « LVL2 »… (place dans la barre, demande de l'enseignant) ;
       le nom du groupe et le score sont en tête du menu ouvert */
    nav.replaceChildren(...[...groupes].map(([nom, indices], g) => {
      const menu = creer("details", "menu"), titre = creer("summary"), liste = creer("div", "menu-liste");
      menu.name = "niveaux"; /* un seul menu ouvert à la fois */
      const ici = indices.includes(courant);
      if (ici) menu.classList.add("menu-courant");
      const gagnees = indices.reduce((t, i) => t + (notes[i] || 0), 0);
      const complet = ici ? `${nom} · niveau ${courant + 1}` : nom, score = `★ ${gagnees}/${indices.length * 3}`;
      titre.append(creer("span", "menu-nom", `LVL${g + 1}`));
      titre.title = `${complet} (${score})`;
      titre.setAttribute("aria-label", `${complet}, score ${gagnees} sur ${indices.length * 3}`);
      const tete = creer("div", "menu-tete");
      tete.append(creer("span", "menu-groupe", complet), creer("span", "menu-score", score));
      liste.append(tete);
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

  /* « Supprimer les blocs grisés » (demande de l'enseignant) : efface tous les blocs non accrochés
     au bloc DÉPART, en une seule étape (Ctrl+Z les rend). Grisé quand il n'y a rien à supprimer. */
  function boutonNettoyer(bouton, ws, typeDepart) {
    const orphelins = () => ws.getTopBlocks(false).filter((b) => b.type !== typeDepart);
    const maj = () => { bouton.disabled = !orphelins().length; };
    ws.addChangeListener((e) => { if (!e.isUiEvent) maj(); });
    bouton.addEventListener("click", () => {
      const liste = orphelins();
      if (!liste.length) return;
      B.Events.setGroup(true);
      try { for (const b of liste) b.dispose(false); } finally { B.Events.setGroup(false); }
      maj();
    });
    maj();
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
      texte.replaceChildren(...riche(t));
      bouton.hidden = !t;
      if (fenetre.open) fenetre.close();
    };
  }

  /* Aide pour débutants (<dialog> écrit dans la page) : onglets à gauche, un sujet à la fois.
     Une page « data-blocs="a b" » n'est proposée que si l'un de ces blocs est dans la boîte du niveau ;
     « data-variables », que si le niveau a des variables. Rend la fonction qui ouvre l'aide. */
  function aide(fenetre) {
    const onglets = [...fenetre.querySelectorAll("[role=tab]")];
    const page = (o) => document.getElementById(o.getAttribute("aria-controls"));
    let sujet = onglets[0].dataset.sujet;
    function choisir(onglet, focus = false) {
      sujet = onglet.dataset.sujet;
      for (const o of onglets) {
        const ici = o === onglet;
        o.setAttribute("aria-selected", String(ici));
        o.tabIndex = ici ? 0 : -1;
        page(o).hidden = !ici;
      }
      if (focus) onglet.focus();
    }
    const visibles = () => onglets.filter((o) => !o.hidden);
    for (const o of onglets) o.addEventListener("click", () => choisir(o));
    fenetre.querySelector("[role=tablist]").addEventListener("keydown", (e) => {
      const v = visibles(), i = v.indexOf(document.activeElement);
      const pas = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (i < 0) return;
      if (pas) choisir(v[(i + pas + v.length) % v.length], true);
      else if (e.key === "Home") choisir(v[0], true);
      else if (e.key === "End") choisir(v[v.length - 1], true);
      else return;
      e.preventDefault();
    });
    for (const b of fenetre.querySelectorAll("[data-fermer]")) b.addEventListener("click", () => fenetre.close());
    fenetre.addEventListener("click", (e) => { if (e.target === fenetre) fenetre.close(); });
    return (blocs = [], variables = false) => {
      for (const o of onglets) {
        const p = page(o), utiles = p.dataset.blocs;
        o.hidden = (utiles !== undefined && !utiles.split(" ").some((n) => blocs.includes(n)))
          || (p.hasAttribute("data-variables") && !variables);
      }
      const v = visibles();
      choisir(v.find((o) => o.dataset.sujet === sujet) || v[0]);
      fenetre.showModal();
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

  /* ---------- Export PDF : programme de l'élève, solutions pour l'espace prof (demande de l'enseignant) ---------- */
  const SVG_NS = "http://www.w3.org/2000/svg";
  /* Empreinte SHA-256 du mot de passe prof (le dépôt est public : jamais le mot de passe en clair).
     Simple rideau : les solutions sont de toute façon dans le code envoyé au navigateur. */
  const EMPREINTE_PROF = "92d33d2803174c930c8da4e8b03613e7e152e955e80cc72e7590163e1d705317";
  let espaceExport = null, policesExport = null;
  /* Polices intégrées à l'image : une image SVG ne charge aucune ressource extérieure */
  async function polices() {
    if (!policesExport) {
      const lire = async (f) => {
        const b = await (await fetch(f)).blob();
        return new Promise((ok) => { const l = new FileReader(); l.onload = () => ok(l.result); l.readAsDataURL(b); });
      };
      const [r, g] = await Promise.all([lire("fonts/Luciole-Regular.woff2"), lire("fonts/Luciole-Bold.woff2")]);
      policesExport = `@font-face{font-family:Luciole;src:url(${r}) format("woff2");font-weight:400}`
        + `@font-face{font-family:Luciole;src:url(${g}) format("woff2");font-weight:700}`;
    }
    return policesExport;
  }
  /* Styles de Blockly et de la page (teinte des « sinon »…), sans les @font-face à adresse relative */
  function feuilles() {
    let css = "";
    for (const f of document.styleSheets) {
      try { for (const r of f.cssRules) if (!(r instanceof CSSFontFaceRule)) css += r.cssText + "\n"; } catch { /* autre origine */ }
    }
    return css;
  }
  /* Blocs d'un état sérialisé -> { toile (2 pixels par pixel d'écran), nb } ; toujours en thème clair.
     « apres(espace) » : retouches propres à l'atelier une fois les blocs dessinés. */
  async function imageBlocs(etat, apres) {
    if (!espaceExport) {
      const boite = creer("div", "export-blocs");
      document.body.append(boite);
      espaceExport = B.inject(boite, { renderer: "cody", theme: THEME_CLAIR, media: "media/", readOnly: true, sounds: false });
    }
    const ws = espaceExport;
    ws.clear();
    B.serialization.workspaces.load(etat, ws);
    await B.renderManagement.finishQueuedRenders();
    if (apres) await apres(ws);
    const nb = ws.getAllBlocks(false).length - ws.getTopBlocks(false).filter((b) => !b.isDeletable()).length;
    if (!ws.getTopBlocks(false).length) return { toile: null, nb: 0 };
    const calque = ws.getCanvas(), cadre = calque.getBBox(), m = 10;
    const svg = document.createElementNS(SVG_NS, "svg");
    const l = cadre.width + 2 * m, h = cadre.height + 2 * m;
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("width", l); svg.setAttribute("height", h);
    svg.setAttribute("viewBox", `${cadre.x - m} ${cadre.y - m} ${l} ${h}`);
    svg.setAttribute("class", ws.getInjectionDiv().className + " blocklySvg");
    const style = document.createElementNS(SVG_NS, "style");
    style.textContent = (await polices()) + "\n" + feuilles();
    const defs = ws.getParentSvg().querySelector("defs");
    const copie = calque.cloneNode(true);
    copie.removeAttribute("transform");
    svg.append(style, ...(defs ? [defs.cloneNode(true)] : []), copie);
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));
    await img.decode();
    const toile = document.createElement("canvas");
    toile.width = Math.ceil(l * 2); toile.height = Math.ceil(h * 2);
    const g = toile.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, toile.width, toile.height);
    g.drawImage(img, 0, 0, toile.width, toile.height);
    return { toile, nb };
  }
  const texteBareme = (opt) => (opt ? `★★★ ${opt} blocs max. · ★★ ${opt + 1} à ${opt + 2} · ★ ${opt + 3} et plus` : "");
  const adresse = () => location.origin + location.pathname;
  const nbBlocs = (n) => `${n} bloc${n > 1 ? "s" : ""}`;

  const ICONE_PDF = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.5h8l5 5V21a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 21z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 2.5V8h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 11v6m-2.6-2.6L12 17l2.6-2.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICONE_PROF = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="15.5" r="1.4" fill="currentColor"/></svg>`;

  /* o : { atelier, fichier, ws, niveau() -> { num, total, titre, verbe, texte, opt }, compter(),
          solutions() -> [{ groupe, num, titre, verbe, texte, opt, etat|null }], apres(espace),
          appliquer(etat) : remplace le programme du niveau courant (espace prof) } */
  function exports(o) {
    const place = document.getElementById("outils-export");
    if (!place) return;
    const bouton = (id, icone, texte, titre) => {
      const b = creer("button", "btn btn-mini btn-icone");
      b.type = "button"; b.id = id; b.title = titre;
      b.innerHTML = icone;
      b.append(creer("span", "", texte));
      return b;
    };
    const pdf = bouton("exporter-pdf", ICONE_PDF, "PDF", "Exporter ton programme en PDF (image des blocs et rappel du niveau)");
    const prof = bouton("espace-prof", ICONE_PROF, "Prof", "Espace prof : solutions des niveaux (mot de passe)");
    place.replaceChildren(pdf, prof);

    const occupe = async (b, travail) => {
      if (b.disabled) return;
      b.disabled = true; b.setAttribute("aria-busy", "true");
      try { await travail(); } catch (e) { console.error("Export PDF impossible.", e); alert("L'export PDF a échoué : " + e.message); }
      finally { b.disabled = false; b.removeAttribute("aria-busy"); }
    };
    pdf.addEventListener("click", () => occupe(pdf, async () => {
      const n = o.niveau(), etat = B.serialization.workspaces.save(o.ws);
      const { toile } = await imageBlocs(etat, o.apres);
      const pages = window.ExportPDF.composer({ ...n, atelier: o.atelier, bareme: texteBareme(n.opt),
        detail: `Mon programme : ${nbBlocs(o.compter())}`, url: adresse(), vide: "Ton programme est vide." }, toile);
      window.ExportPDF.telecharger(await window.ExportPDF.fabriquer(pages), `cody-${o.fichier}-niveau-${n.num}.pdf`);
    }));

    /* Espace prof : mot de passe, puis choix des niveaux */
    const d = creer("dialog", "prof");
    d.setAttribute("aria-labelledby", "prof-titre");
    const titre = creer("h2", "", "Espace prof : solutions"); titre.id = "prof-titre";
    const acces = creer("form", "prof-acces");
    const etiquette = creer("label", "", "Mot de passe"); etiquette.htmlFor = "prof-mdp";
    const champ = creer("input"); champ.type = "password"; champ.id = "prof-mdp"; champ.autocomplete = "current-password";
    const erreur = creer("p", "prof-erreur"); erreur.setAttribute("role", "alert");
    const entrer = creer("button", "btn btn-go", "Valider"); entrer.type = "submit";
    acces.append(etiquette, champ, entrer, erreur);
    const choix = creer("div", "prof-choix"); choix.hidden = true;
    const liste = creer("div", "prof-liste");
    const tout = creer("button", "btn btn-mini", "Tout cocher"); tout.type = "button";
    const rien = creer("button", "btn btn-mini", "Tout décocher"); rien.type = "button";
    const sortir = creer("button", "btn btn-go", "Exporter les solutions (PDF)"); sortir.type = "button";
    const etat = creer("p", "prof-etat"); etat.setAttribute("aria-live", "polite");
    const actions = creer("div", "prof-actions"); actions.append(tout, rien);
    /* « Appliquer la correction » (demande de l'enseignant) : le programme du niveau courant est
       remplacé par la solution ; deux clics, comme « Recommencer le niveau » */
    const appliquer = creer("button", "btn btn-sec prof-appliquer"); appliquer.type = "button";
    appliquer.append(creer("span"));
    /* « Visualiser » (demande de l'enseignant) : les solutions cochées, à l'écran, sans PDF */
    const voir = creer("button", "btn btn-sec", "Visualiser"); voir.type = "button";
    voir.title = "Afficher ici les solutions des niveaux cochés";
    const boutonsProf = creer("div", "prof-boutons"); boutonsProf.append(voir, sortir, appliquer);
    choix.append(creer("p", "prof-aide", "Coche un ou plusieurs niveaux : une page par solution."), actions, liste, boutonsProf, etat);
    const apercu = creer("div", "prof-apercu"); apercu.hidden = true;
    const retour = creer("button", "btn btn-sec", "← Retour aux niveaux"); retour.type = "button";
    const planches = creer("div", "prof-planches");
    apercu.append(retour, planches);
    const fermer = creer("button", "btn btn-sec prof-fermer", "Fermer"); fermer.type = "button";
    d.append(titre, acces, choix, apercu, fermer);
    document.body.append(d);

    const ouvert = () => { try { return sessionStorage.getItem("cody-prof") === "1"; } catch { return false; } };
    function remplir() {
      const courant = o.niveau().num, groupes = new Map();
      for (const s of o.solutions()) {
        const nom = s.groupe || "Niveaux";
        if (!groupes.has(nom)) groupes.set(nom, []);
        groupes.get(nom).push(s);
      }
      liste.replaceChildren(...[...groupes].map(([nom, niveaux]) => {
        const f = creer("fieldset"); f.append(creer("legend", "", nom));
        for (const s of niveaux) {
          const l = creer("label"), c = creer("input");
          c.type = "checkbox"; c.value = s.num; c.checked = s.num === courant;
          l.append(c, ` ${s.num} · ${s.titre}`);
          f.append(l);
        }
        return f;
      }));
      annulerAppliquer();
      const ici = o.solutions().find((s) => s.num === courant);
      appliquer.querySelector("span").textContent = `Appliquer la correction du niveau ${courant}`;
      appliquer.dataset.normal = appliquer.querySelector("span").textContent;
      appliquer.disabled = !(ici && ici.etat && o.appliquer);
      appliquer.title = appliquer.disabled ? "Pas de solution pour ce niveau" : "Efface ton programme et le remplace par la solution";
      acces.hidden = true; choix.hidden = false; apercu.hidden = true; planches.replaceChildren(); etat.textContent = "";
    }
    const cochees = () => {
      const voulus = new Set([...liste.querySelectorAll("input:checked")].map((c) => +c.value));
      return o.solutions().filter((s) => voulus.has(s.num));
    };
    voir.addEventListener("click", () => occupe(voir, async () => {
      const choisis = cochees();
      if (!choisis.length) { etat.textContent = "Coche au moins un niveau."; return; }
      const figures = [];
      for (const [i, s] of choisis.entries()) {
        etat.textContent = `Préparation : ${i + 1} sur ${choisis.length}…`;
        const f = creer("figure");
        f.append(creer("h3", "", `${s.groupe ? s.groupe + " · " : ""}Niveau ${s.num} · ${s.titre}`));
        if (s.etat) {
          const { toile, nb } = await imageBlocs(s.etat, o.apres);
          const img = creer("img");
          img.src = toile.toDataURL("image/png");
          img.alt = `Solution du niveau ${s.num} en blocs`;
          img.width = Math.round(toile.width / 2); /* la toile est dessinée à ×2 : taille réelle des blocs */
          f.append(creer("figcaption", "", `Solution en ${nbBlocs(s.nb ?? nb)} · ${texteBareme(s.opt)}`), img);
        } else f.append(creer("figcaption", "", "Pas de solution : niveau de création libre."));
        figures.push(f);
      }
      planches.replaceChildren(...figures);
      etat.textContent = "";
      choix.hidden = true; apercu.hidden = false;
      planches.scrollTop = 0; retour.focus();
    }));
    retour.addEventListener("click", () => { apercu.hidden = true; choix.hidden = false; voir.focus(); });
    let attenteAppliquer = 0;
    function annulerAppliquer() {
      clearTimeout(attenteAppliquer); attenteAppliquer = 0;
      if (appliquer.dataset.normal) appliquer.querySelector("span").textContent = appliquer.dataset.normal;
      appliquer.classList.remove("a-confirmer");
    }
    appliquer.addEventListener("click", () => {
      if (!attenteAppliquer) {
        appliquer.querySelector("span").textContent = "Confirmer : effacer le code ?";
        appliquer.classList.add("a-confirmer");
        attenteAppliquer = setTimeout(annulerAppliquer, 4000);
        return;
      }
      annulerAppliquer();
      const courant = o.niveau().num, ici = o.solutions().find((s) => s.num === courant);
      if (!ici || !ici.etat) return;
      o.appliquer(ici.etat);
      d.close();
    });
    d.addEventListener("close", annulerAppliquer);
    document.getElementById("espace-prof").addEventListener("click", () => {
      champ.value = ""; erreur.textContent = "";
      if (ouvert()) remplir(); else { acces.hidden = false; choix.hidden = true; }
      d.showModal();
      (ouvert() ? sortir : champ).focus();
    });
    acces.addEventListener("submit", (e) => {
      e.preventDefault();
      if (window.ExportPDF.sha256(champ.value) !== EMPREINTE_PROF) { erreur.textContent = "Mot de passe incorrect."; champ.select(); return; }
      try { sessionStorage.setItem("cody-prof", "1"); } catch { /* stockage indisponible */ }
      remplir(); sortir.focus();
    });
    fermer.addEventListener("click", () => d.close());
    const cocher = (v) => liste.querySelectorAll("input").forEach((c) => { c.checked = v; });
    tout.addEventListener("click", () => cocher(true));
    rien.addEventListener("click", () => cocher(false));
    sortir.addEventListener("click", () => occupe(sortir, async () => {
      const choisis = cochees();
      if (!choisis.length) { etat.textContent = "Coche au moins un niveau."; return; }
      const pages = [];
      for (const [i, s] of choisis.entries()) {
        etat.textContent = `Préparation : ${i + 1} sur ${choisis.length}…`;
        const { toile, nb } = s.etat ? await imageBlocs(s.etat, o.apres) : { toile: null, nb: 0 };
        pages.push(...window.ExportPDF.composer({ ...s, atelier: o.atelier, solution: true, bareme: texteBareme(s.opt),
          detail: s.etat ? `Solution en ${nbBlocs(s.nb ?? nb)}` : "", url: adresse(), vide: "Pas de solution : niveau de création libre." }, toile));
      }
      etat.textContent = "Écriture du PDF…";
      const nom = choisis.length === 1 ? `cody-${o.fichier}-niveau-${choisis[0].num}-solution.pdf` : `cody-${o.fichier}-solutions.pdf`;
      window.ExportPDF.telecharger(await window.ExportPDF.fabriquer(pages), nom);
      etat.textContent = `PDF prêt : ${choisis.length} niveau${choisis.length > 1 ? "x" : ""}.`;
    }));
  }

  window.Atelier = { riche, sansMarques, memo, exports, imageBlocs, sombre, injecter, noter, creer, etoiles, bareme, feter, fermerFete, verdict, consigne, boutonsNiveaux, boutonConfirmer, boutonCopier, boutonNettoyer, marquerErreur, boutonIndice, aide, boutonExecuter, cadrer };
}

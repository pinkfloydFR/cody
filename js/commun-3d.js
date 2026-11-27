/* Outils communs aux rendus 3D (manutention-3d.js, tri-3d.js, pivot-3d.js) :
   - qualité selon la machine : mode « léger » si le navigateur dessine sans carte graphique
     (SwiftShader, llvmpipe…), si on le demande (?leger, ou localStorage « cody-3d » = « leger »), ou si
     l'animation se révèle trop lente (alleger, appelé par manutention.js). « ?complet » l'interdit.
   - fusion des pièces fixes : une pièce par matière au lieu de dizaines, soit beaucoup moins
     d'appels de dessin (le coût principal mesuré le 27/11/2026, bien avant les ombres). */
window.Commun3D = (() => {
  const params = new URLSearchParams(location.search);
  let choix = params.has("leger") ? "leger" : params.has("complet") ? "complet" : null;
  if (!choix) try { choix = localStorage.getItem("cody-3d"); } catch { /* stockage indisponible */ }

  /* Mode léger : jamais sous la résolution de l'écran. Le rendu à 70 % (essayé le 27/11/2026) rendait
     les numéros et les noms des caisses difficiles à lire (retour d'un élève) ; on garde aussi le
     filtrage des textures au maximum, peu coûteux et nécessaire aux étiquettes vues de biais. */
  const RESOLUTION_LEGERE = 1;
  let leger = null;
  /* Rendu logiciel : le navigateur n'utilise pas la carte graphique (pilote absent ou bloqué) */
  function logiciel() {
    try {
      const g = document.createElement("canvas").getContext("webgl");
      if (!g) return false;
      const info = g.getExtension("WEBGL_debug_renderer_info");
      const nom = info ? g.getParameter(info.UNMASKED_RENDERER_WEBGL) : "";
      const perte = g.getExtension("WEBGL_lose_context");
      if (perte) perte.loseContext();
      return /swiftshader|llvmpipe|softpipe|basic render|software/i.test(nom);
    } catch { return false; }
  }
  const estLeger = () => {
    if (leger === null) {
      const sansCarte = choix !== "leger" && choix !== "complet" && logiciel();
      leger = choix === "leger" || sansCarte;
      if (choix === "leger") console.info("Vue 3D : mode léger demandé (?leger ou réglage cody-3d).");
      else if (sansCarte) console.info("Vue 3D : mode léger, le navigateur dessine sans carte graphique (accélération matérielle désactivée ?).");
    }
    return leger;
  };

  function creerRendu(toile) {
    const T = window.THREE, L = estLeger();
    /* Anticrénelage gardé en mode léger : le couper ne faisait rien gagner (mesuré sans carte graphique) */
    const rendu = new T.WebGLRenderer({ canvas: toile, antialias: true });
    rendu.setPixelRatio(L ? Math.min(devicePixelRatio, RESOLUTION_LEGERE) : Math.min(devicePixelRatio, 1.5));
    rendu.shadowMap.enabled = true;
    rendu.shadowMap.type = L ? T.PCFShadowMap : T.PCFSoftShadowMap;
    rendu.outputEncoding = T.sRGBEncoding;
    rendu.toneMapping = T.ACESFilmicToneMapping;
    rendu.toneMappingExposure = .86;
    return rendu;
  }
  const anisotropie = (rendu) => rendu.capabilities.getMaxAnisotropy();

  /* Chaque rendu inscrit son soleil : alleger() peut ensuite baisser la qualité en cours de route */
  const inscrits = [];
  function ombres(rendu, monde, soleil, redessiner) {
    const n = estLeger() ? 1024 : 2048;
    soleil.shadow.mapSize.set(n, n);
    inscrits.push({ rendu, monde, soleil, redessiner });
  }
  function alleger() {
    if (estLeger()) return false;
    leger = true;
    const T = window.THREE;
    for (const { rendu, monde, soleil, redessiner } of inscrits) {
      rendu.setPixelRatio(Math.min(devicePixelRatio, RESOLUTION_LEGERE));
      rendu.shadowMap.type = T.PCFShadowMap;
      soleil.shadow.mapSize.set(1024, 1024);
      if (soleil.shadow.map) { soleil.shadow.map.dispose(); soleil.shadow.map = null; }
      monde.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
      redessiner();
    }
    console.info("Vue 3D : animation lente, passage en mode léger.");
    return true;
  }
  /* Écart minimal entre deux images pendant l'animation (60 images/s, 30 en mode léger) */
  const intervalle = () => (leger ? 1000 / 30 : 1000 / 60);

  /* Fusionne les pièces de « racine » qui ne bougent pas les unes par rapport aux autres : une seule
     pièce par matière (et par réglage d'ombre). Les objets de « mobiles » et tout ce qu'ils contiennent
     sont laissés tels quels. Pièces écartées : plusieurs matières, câble (frustumCulled faux).
     Sur la scène entière, les pièces plates posées au sol ne projettent plus d'ombre. */
  function fusionner(racine, mobiles = []) {
    const T = window.THREE, exclus = new Set(mobiles), groupes = new Map();
    racine.updateMatrixWorld(true);
    const inverse = racine.matrixWorld.clone().invert();
    const parcourir = (o) => {
      if (exclus.has(o)) return;
      const a = o.isMesh && o.geometry.attributes;
      if (a && !Array.isArray(o.material) && o.frustumCulled && o.visible && a.position && a.normal && a.uv) {
        const m = new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld);
        let porte = o.castShadow;
        if (racine.isScene && porte) {
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const b = o.geometry.boundingBox.clone().applyMatrix4(m);
          if (b.max.y - b.min.y < .1 && b.max.y < .25) porte = false;
        }
        const cle = `${o.material.uuid}|${porte}|${o.receiveShadow}`;
        if (!groupes.has(cle)) groupes.set(cle, { mat: o.material, porte, recoit: o.receiveShadow, liste: [] });
        groupes.get(cle).liste.push([o, m]);
      }
      for (const e of [...o.children]) parcourir(e);
    };
    parcourir(racine);
    for (const { mat, porte, recoit, liste } of groupes.values()) {
      if (liste.length < 2) { liste[0][0].castShadow = porte; continue; }
      const geos = liste.map(([o, m]) => {
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        return g.applyMatrix4(m);
      });
      const fusion = new T.BufferGeometry();
      for (const nom of ["position", "normal", "uv"]) {
        const taille = geos[0].attributes[nom].itemSize;
        const tab = new Float32Array(geos.reduce((n, g) => n + g.attributes[nom].array.length, 0));
        let k = 0;
        for (const g of geos) { tab.set(g.attributes[nom].array, k); k += g.attributes[nom].array.length; }
        fusion.setAttribute(nom, new T.BufferAttribute(tab, taille));
      }
      geos.forEach((g) => g.dispose());
      const piece = new T.Mesh(fusion, mat);
      piece.castShadow = porte; piece.receiveShadow = recoit;
      for (const [o] of liste) o.parent.remove(o);
      racine.add(piece);
    }
    return racine;
  }

  return { creerRendu, anisotropie, ombres, alleger, intervalle, fusionner, get leger() { return estLeger(); } };
})();

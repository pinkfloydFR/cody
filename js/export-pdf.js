/* Export PDF, sans bibliothèque ni service extérieur : chaque page est dessinée sur une toile (A4 à
   150 ppp), puis écrite dans un PDF minimal (image compressée sans perte, liens cliquables).
   Sert au PDF de l'élève (son programme) et aux solutions de l'espace prof (atelier.js). */
window.ExportPDF = (() => {
  const LARGEUR = 1240, HAUTEUR = 1754, MARGE = 90;          /* A4, en pixels à 150 ppp */
  const PT = 595.28 / LARGEUR;                               /* pixels -> points PDF */
  const POLICE = "Luciole, system-ui, sans-serif";
  const ENCRE = "#1c2532", DOUX = "#53606f", ACCENT = "#0e6b78";

  /* ---------- Empreinte SHA-256 (le mot de passe prof n'est jamais écrit en clair dans le code) ---------- */
  function sha256(texte) {
    const K = [], H = [];
    const premier = (n) => { for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
    for (let n = 2, i = 0; i < 64; n++) if (premier(n)) {
      if (i < 8) H[i] = (Math.pow(n, 1 / 2) % 1) * 2 ** 32 | 0;
      K[i++] = (Math.pow(n, 1 / 3) % 1) * 2 ** 32 | 0;
    }
    const o = new TextEncoder().encode(texte), l = o.length;
    const m = new Uint8Array(((l + 9 + 63) >> 6) << 6);
    m.set(o); m[l] = 0x80;
    new DataView(m.buffer).setUint32(m.length - 4, l * 8);
    const w = new Int32Array(64), r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let p = 0; p < m.length; p += 64) {
      for (let i = 0; i < 16; i++) w[i] = new DataView(m.buffer).getInt32(p + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) | 0; });
    }
    return H.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
  }

  /* ---------- Pages ---------- */
  function lignes(g, texte, largeur) {
    const sortie = [];
    for (const para of texte.split("\n")) {
      let ligne = "";
      for (const mot of para.split(" ")) {
        const essai = ligne ? ligne + " " + mot : mot;
        if (g.measureText(essai).width > largeur && ligne) { sortie.push(ligne); ligne = mot; } else ligne = essai;
      }
      sortie.push(ligne);
    }
    return sortie;
  }
  function nouvellePage() {
    const c = document.createElement("canvas");
    c.width = LARGEUR; c.height = HAUTEUR;
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, LARGEUR, HAUTEUR);
    g.textBaseline = "alphabetic";
    return { c, g, liens: [] };
  }
  /* infos : { atelier, num, total, titre, verbe, texte, bareme, detail, url, solution }
     image : toile des blocs (2 pixels par pixel d'écran), ou null */
  function composer(infos, image) {
    const pages = [];
    let p = nouvellePage(), y = MARGE;
    const plein = LARGEUR - 2 * MARGE;
    const ecrire = (texte, taille, gras, couleur, interligne = 1.35) => {
      p.g.font = `${gras ? 700 : 400} ${taille}px ${POLICE}`;
      p.g.fillStyle = couleur;
      for (const l of lignes(p.g, texte, plein)) { y += taille * interligne; p.g.fillText(l, MARGE, y); }
    };
    /* En-tête */
    p.g.font = `400 22px ${POLICE}`; p.g.fillStyle = DOUX;
    p.g.fillText(`Cody · Atelier ${infos.atelier}`, MARGE, y + 22);
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    p.g.textAlign = "right"; p.g.fillText(date, LARGEUR - MARGE, y + 22); p.g.textAlign = "left";
    y += 34;
    ecrire(`Niveau ${infos.num} sur ${infos.total} · ${infos.titre}`, 40, true, ENCRE, 1.3);
    if (infos.solution) {
      y += 14;
      p.g.font = `700 24px ${POLICE}`;
      const etiquette = "SOLUTION", l = p.g.measureText(etiquette).width + 28;
      p.g.fillStyle = ACCENT; p.g.fillRect(MARGE, y, l, 38);
      p.g.fillStyle = "#fff"; p.g.fillText(etiquette, MARGE + 14, y + 27);
      p.g.fillStyle = ENCRE; p.g.font = `400 24px ${POLICE}`;
      p.g.fillText(infos.detail || "", MARGE + l + 16, y + 27);
      y += 44;
    }
    y += 8;
    ecrire(`${infos.verbe ? infos.verbe + " " : ""}${infos.texte}`, 27, false, ENCRE);
    if (infos.bareme) { y += 6; ecrire(`Objectif : ${infos.bareme}`, 23, false, DOUX); }
    if (!infos.solution && infos.detail) { y += 4; ecrire(infos.detail, 23, true, ENCRE); }
    /* Adresse du jeu, cliquable dans le PDF */
    y += 8;
    p.g.font = `400 21px ${POLICE}`; p.g.fillStyle = ACCENT;
    const adresse = lignes(p.g, infos.url, plein)[0];
    p.g.fillText(adresse, MARGE, y + 21);
    p.liens.push({ x: MARGE, y: y, l: p.g.measureText(adresse).width, h: 28, url: infos.url });
    y += 44;
    p.g.fillStyle = "#d3d9e1"; p.g.fillRect(MARGE, y, plein, 2);
    y += 34;
    if (!image) {
      ecrire(infos.vide || "Aucun bloc.", 26, false, DOUX);
      pages.push(p);
      return pages;
    }
    /* Blocs : 1,7 pixel de page par pixel d'écran au plus ; plus petit si trop large. Une image trop
       haute continue sur les pages suivantes. */
    let echelle = Math.min(1.7, plein / (image.width / 2)) / 2;
    /* Un peu trop haute : on la réduit (jusqu'à 60 %) plutôt que de déborder sur une page presque vide */
    const reste = HAUTEUR - MARGE - y;
    if (image.height * echelle > reste && reste / (image.height * echelle) >= .6) echelle = reste / image.height;
    let source = 0;
    while (source < image.height) {
      const place = HAUTEUR - MARGE - y, tranche = Math.min(image.height - source, Math.floor(place / echelle));
      if (tranche < Math.min(image.height - source, 120)) { pages.push(p); p = nouvellePage(); y = MARGE; continue; }
      p.g.drawImage(image, 0, source, image.width, tranche, MARGE, y, image.width * echelle, tranche * echelle);
      source += tranche;
      pages.push(p);
      if (source < image.height) {
        p = nouvellePage(); y = MARGE;
        p.g.font = `400 22px ${POLICE}`; p.g.fillStyle = DOUX;
        p.g.fillText(`Cody · Niveau ${infos.num} · ${infos.titre} (suite)`, MARGE, y + 22);
        y += 60;
      }
    }
    return pages;
  }

  /* ---------- Fichier PDF ---------- */
  async function compresser(octets) {
    const flux = new Blob([octets]).stream().pipeThrough(new CompressionStream("deflate"));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  }
  const echapper = (s) => s.replace(/[\\()]/g, (c) => "\\" + c).replace(/[^\x20-\x7e]/g, "");
  async function fabriquer(pages) {
    const morceaux = [], decalages = [];
    let taille = 0;
    const ajouter = (x) => { const o = typeof x === "string" ? new TextEncoder().encode(x) : x; morceaux.push(o); taille += o.length; };
    const objet = (n, entete, flux) => {
      decalages[n] = taille;
      ajouter(`${n} 0 obj\n${entete}\n`);
      if (flux) { ajouter("stream\n"); ajouter(flux); ajouter("\nendstream\n"); }
      ajouter("endobj\n");
    };
    ajouter("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
    const W = (LARGEUR * PT).toFixed(2), Hp = (HAUTEUR * PT).toFixed(2);
    const n0 = 3, parPage = 3;
    const kids = pages.map((_, i) => `${n0 + i * parPage} 0 R`).join(" ");
    objet(1, "<< /Type /Catalog /Pages 2 0 R >>");
    objet(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
    for (let i = 0; i < pages.length; i++) {
      const { c, liens } = pages[i], np = n0 + i * parPage;
      const px = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const rgb = new Uint8Array(c.width * c.height * 3);
      for (let s = 0, d = 0; s < px.length; s += 4) { rgb[d++] = px[s]; rgb[d++] = px[s + 1]; rgb[d++] = px[s + 2]; }
      const image = await compresser(rgb);
      const annots = liens.map((k) => {
        const x1 = k.x * PT, y1 = (HAUTEUR - k.y - k.h) * PT, x2 = (k.x + k.l) * PT, y2 = (HAUTEUR - k.y) * PT;
        return `<< /Type /Annot /Subtype /Link /Rect [${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}] /Border [0 0 0] /A << /S /URI /URI (${echapper(encodeURI(decodeURI(k.url)))}) >> >>`;
      }).join(" ");
      objet(np, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${Hp}] /Resources << /XObject << /Im0 ${np + 1} 0 R >> >> /Contents ${np + 2} 0 R${annots ? ` /Annots [${annots}]` : ""} >>`);
      objet(np + 1, `<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${image.length} >>`, image);
      const contenu = `q ${W} 0 0 ${Hp} 0 0 cm /Im0 Do Q`;
      objet(np + 2, `<< /Length ${contenu.length} >>`, new TextEncoder().encode(contenu));
    }
    const total = n0 + pages.length * parPage, xref = taille;
    ajouter(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let n = 1; n < total; n++) ajouter(`${String(decalages[n]).padStart(10, "0")} 00000 n \n`);
    ajouter(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(morceaux, { type: "application/pdf" });
  }
  function telecharger(blob, nom) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nom;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  return { sha256, composer, fabriquer, telecharger };
})();

/* =========================================================
   A.S. BRUGHEAS — motion design
   GSAP + ScrollTrigger + Lenis
   ========================================================= */

/* ---------------------------------------------------------
   DONNÉES À METTRE À JOUR CHAQUE SEMAINE
   - FIXTURES : les matchs du week-end (section « Ce week-end »)
   - SEASON   : le fil de la saison (cartes horizontales)
   Dates au format ISO avec fuseau : "2026-11-08T15:00:00+01:00"
   --------------------------------------------------------- */
const FIXTURES = [
  {
    cat: "Seniors", sub: "Championnat · Journée 6",
    home: "USTB 2", away: "A.S. Brugheas",
    date: "2026-11-08T15:00:00+01:00",
    place: "Stade municipal · 03500 Bransat"
  },
  {
    cat: "Féminines", sub: "Championnat · Journée 4",
    home: "St-Germain-des-Fossés", away: "A.S. Brugheas",
    date: "2026-11-08T15:00:00+01:00",
    place: "Stade des Îles 1 · Saint-Germain-des-Fossés"
  }
];

const SEASON = [
  { img: "affiche-coupe-de-france", tag: "Coupe de France", date: "23 août", meta: "AS Brugheas – AS Val de Sioule · 14h30 · Stade Marcel Epinat" },
  { img: "affiche-ecole-de-foot", tag: "École de foot", date: "5 septembre", meta: "Initiation / découverte pour les petits nés de 2019 à 2022" },
  { img: "affiche-seniors-j1", tag: "Seniors · J1", date: "6 septembre", meta: "A.S. Brugheas – Chantelle C.S 2 · 15h · Stade Marcel Epinat" },
  { img: "affiche-challenge-jean-vidal", tag: "Challenge Jean Vidal", date: "13 septembre", meta: "A.S. Brugheas – Sporting Portugal · 15h" },
  { img: "affiche-rentree-u7", tag: "École de foot", date: "26 septembre", meta: "La rentrée du foot U7 · premier plateau U6/U7" },
  { img: "affiche-feminines-j1", tag: "Féminines · J1", date: "27 septembre", meta: "Jaligny – A.S. Brugheas · 11h · Jaligny-sur-Besbre" },
  { img: "affiche-seniors-j3", tag: "Seniors · J3", date: "4 octobre", meta: "A.S. Brugheas – UASC · 15h · Stade Marcel Epinat" },
  { img: "affiche-feminines-j3", tag: "Féminines · J3", date: "11 octobre", meta: "A.S. Brugheas – Diou E.S · 10h · Stade Marcel Epinat" },
  { img: "affiche-challenge-paul-baptiste", tag: "Challenge Paul Baptiste", date: "11 octobre", meta: "Gipcy A.S – A.S. Brugheas · 14h30 · Gipcy" },
  { img: "affiche-seniors-j4", tag: "Seniors · J4", date: "18 octobre", meta: "Mayotte FC 2 – A.S. Brugheas · Bellerive-sur-Allier", result: { type: "win", text: "Victoire 8-2" } },
  { img: "affiche-seniors-j5", tag: "Seniors · J5", date: "25 octobre", meta: "A.S. Brugheas – Abrest U.S 2 · 15h · Stade Marcel Epinat", result: { type: "draw", text: "Match nul" } },
  { img: "affiche-seniors-j6", tag: "Seniors · J6", date: "8 novembre", meta: "USTB 2 – A.S. Brugheas · 15h · Bransat", result: { type: "next", text: "Ce week-end" } },
  { img: "affiche-feminines-j4", tag: "Féminines · J4", date: "8 novembre", meta: "St-Germain-des-Fossés – A.S. Brugheas · 15h", result: { type: "next", text: "Ce week-end" } }
];

/* --------------------------------------------------------- */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Construire le contenu dynamique (toujours, même sans GSAP) ---------- */
function buildSeason() {
  const track = $("#seasonTrack");
  track.innerHTML = SEASON.map(s => `
    <article class="s-card" data-cursor="Voir">
      <div class="s-poster">
        <span class="s-tag">${s.tag}</span>
        <img src="assets/img/${s.img}.jpg" alt="Affiche : ${s.tag}, ${s.date}" loading="lazy">
      </div>
      ${s.result ? `<span class="s-result ${s.result.type}">${s.result.text}</span>` : ""}
      <h3 class="s-date">${s.date}</h3>
      <p class="s-meta">${s.meta}</p>
    </article>`).join("");
}

const FR_DATE = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
function buildFixtures() {
  const list = $("#fixtureList");
  list.innerHTML = FIXTURES.map((f, i) => {
    const d = new Date(f.date);
    const label = FR_DATE.format(d).replace(":", "h");
    const isAsb = n => /brugheas/i.test(n);
    return `
    <div class="fixture" data-i="${i}">
      <div class="fx-cat">${f.cat}<small>${f.sub}</small></div>
      <div class="fx-team home ${isAsb(f.home) ? "asb" : ""}">${f.home}</div>
      <div class="fx-vs">VS</div>
      <div class="fx-team ${isAsb(f.away) ? "asb" : ""}">${f.away}</div>
      <div class="fx-info"><b>${label.charAt(0).toUpperCase() + label.slice(1)}</b>${f.place}<div class="fx-live" data-date="${f.date}"></div></div>
    </div>`;
  }).join("");
  tickFixtures();
  setInterval(tickFixtures, 1000);
}
function tickFixtures() {
  const now = Date.now();
  $$(".fx-live").forEach(el => {
    const t = new Date(el.dataset.date).getTime();
    const diff = t - now;
    let html;
    if (diff > 0) {
      const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      const p = n => String(n).padStart(2, "0");
      html = `<div class="fx-count"><span>${p(d)}<small>JOURS</small></span><span>${p(h)}<small>H</small></span><span>${p(m)}<small>MIN</small></span><span>${p(s)}<small>SEC</small></span></div>`;
    } else if (diff > -2 * 36e5) {
      html = `<span class="fx-status live">En cours</span>`;
    } else {
      html = `<span class="fx-status">Terminé · score sur nos réseaux</span>`;
    }
    if (el.innerHTML !== html) el.innerHTML = html;
  });
}

buildSeason();
buildFixtures();
$("#year").textContent = new Date().getFullYear();

/* ---------- Sans GSAP : on affiche tout simplement ---------- */
if (!window.gsap || !window.ScrollTrigger) {
  $("#preloader")?.remove();
  document.body.classList.remove("is-loading");
} else {
  init();
}

function init() {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Split helpers ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute("aria-label", text.trim());
    el.innerHTML = text.split(/(\s+)/).map(w => {
      if (/^\s+$/.test(w)) return " ";
      return `<span class="word" aria-hidden="true">${[...w].map(c => `<span class="char">${c}</span>`).join("")}</span>`;
    }).join("");
    return $$(".char", el);
  }
  function splitWords(el) {
    // conserve les <em> : on découpe chaque nœud texte
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
            const outer = document.createElement("span"); outer.className = "word";
            const inner = document.createElement("span"); inner.className = "word-in"; inner.textContent = w;
            outer.appendChild(inner); frag.appendChild(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$(".word-in", el);
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.lenis = lenis;
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  }));

  /* ---------- Préparer les textes ---------- */
  const heroSmall = splitChars($(".ht-small"));
  const heroBig = splitChars($(".ht-big"));
  const schoolChars = splitChars($(".school-title"));
  $$(".split-words").forEach(el => splitWords(el));

  // manifesto : mots individuels pour le remplissage au scroll
  const manifesto = $(".fill-text");
  manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/).map(w => `<span class="fw">${w}</span>`).join(" ");

  /* ---------- PRELOADER ---------- */
  const petalsG = $(".pre-flower .petals");
  for (let i = 0; i < 8; i++) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", "M0,-16 C13,-30 15,-52 0,-74 C-15,-52 -13,-30 0,-16Z");
    p.setAttribute("class", "petal");
    p.setAttribute("transform", `rotate(${i * 45})`);
    petalsG.appendChild(p);
  }
  const petals = $$(".petal");
  const counter = { v: 0 };
  gsap.set(".hero-kicker, .hero-script, .hero-actions > *, .hero-badge, .nav", { autoAlpha: 0 });
  gsap.set([...heroSmall, ...heroBig], { yPercent: 110, rotate: 8 });
  gsap.set(".hero-img", { scale: 1.35 });

  const pre = gsap.timeline({ defaults: { ease: "power3.out" } });
  pre.from(petals, { scale: 0, opacity: 0, duration: .6, stagger: .09, ease: "back.out(2)" })
     .to(".pre-ring", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 0)
     .to(counter, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => $("#preCount").textContent = Math.round(counter.v) }, 0)
     .to(".pre-flower", { rotate: 180, duration: 1.6, ease: "power2.inOut" }, 0)
     .to(".pre-inner", { scale: .8, autoAlpha: 0, duration: .5, ease: "power2.in" }, "+=.15")
     .set(".pre-curtain", { background: "#e3b34a" })
     .to(".pre-curtain.c1", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "<")
     .to(".pre-curtain.c2", { yPercent: 100, duration: 1, ease: "expo.inOut" }, "<")
     .set("#preloader", { background: "transparent" }, "<")
     .add(() => { $("#preloader").remove(); document.body.classList.remove("is-loading"); lenis?.start(); ScrollTrigger.refresh(); })
     .add(heroIntro(), "-=.7");
  document.body.classList.add("is-loading");

  function heroIntro() {
    return gsap.timeline({ defaults: { ease: "expo.out" } })
      .to(".hero-img", { scale: 1.08, duration: 2.6 }, 0)
      .to(heroSmall, { yPercent: 0, rotate: 0, duration: 1.2, stagger: .05 }, .1)
      .to(heroBig, { yPercent: 0, rotate: 0, duration: 1.4, stagger: .06 }, .2)
      .to(".hero-kicker", { autoAlpha: 1, duration: 1 }, .6)
      .fromTo(".hero-script", { autoAlpha: 0, x: -40, rotate: -10 }, { autoAlpha: 1, x: 0, rotate: -3, duration: 1.2 }, .8)
      .fromTo(".hero-actions > *", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1, stagger: .12 }, 1)
      .fromTo(".hero-badge", { autoAlpha: 0, scale: .3, rotate: -180 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.6 }, .7)
      .to(".nav", { autoAlpha: 1, duration: 1 }, 1);
  }

  /* ---------- Curseur ---------- */
  if (!isTouch) {
    const cur = $("#cursor"), dot = $("#cursorDot"), label = $(".cursor-label");
    const xTo = gsap.quickTo(cur, "x", { duration: .45, ease: "power3" });
    const yTo = gsap.quickTo(cur, "y", { duration: .45, ease: "power3" });
    const dx = gsap.quickTo(dot, "x", { duration: .08 });
    const dy = gsap.quickTo(dot, "y", { duration: .08 });
    addEventListener("mousemove", e => { document.body.classList.add("has-mouse"); xTo(e.clientX); yTo(e.clientY); dx(e.clientX); dy(e.clientY); });
    document.addEventListener("mouseover", e => {
      const view = e.target.closest(".gallery figure, .s-card, .goal-card, .team-panel");
      const link = e.target.closest("a, button, .pill");
      cur.classList.toggle("is-view", !!view);
      cur.classList.toggle("is-hover", !view && !!link);
      if (view) label.textContent = view.dataset.cursor || "Voir";
    });
    document.addEventListener("mousedown", () => gsap.to(cur, { scale: .8, duration: .2 }));
    document.addEventListener("mouseup", () => gsap.to(cur, { scale: 1, duration: .3 }));
  }

  /* ---------- Boutons magnétiques ---------- */
  if (!isTouch) {
    $$(".magnetic, .magnetic-soft").forEach(btn => {
      const strength = btn.classList.contains("magnetic-soft") ? .12 : .35;
      const inner = btn.querySelector("span");
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: x * strength, y: y * strength, duration: .5, ease: "power3.out" });
        if (inner) gsap.to(inner, { x: x * strength * .5, y: y * strength * .5, duration: .5, ease: "power3.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: .9, ease: "elastic.out(1, .35)" });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: .9, ease: "elastic.out(1, .35)" });
      });
    });
  }

  /* ---------- Nav (cache/affiche) + barre de progression ---------- */
  const nav = $("#nav");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: self => {
      nav.classList.toggle("is-scrolled", self.scroll() > 60);
      nav.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 400 && !menuOpen);
      gsap.set("#progress", { scaleX: self.progress });
    }
  });

  /* ---------- Menu mobile ---------- */
  let menuOpen = false;
  const burger = $("#burger"), menu = $("#menu");
  const menuTl = gsap.timeline({ paused: true })
    .to(".menu-bg", { clipPath: "circle(150% at calc(100% - 40px) 38px)", duration: .9, ease: "expo.inOut" })
    .to(".menu-links a", { opacity: 1, y: 0, duration: .7, stagger: .06, ease: "expo.out" }, "-=.4")
    .to(".menu-foot", { opacity: 1, duration: .5 }, "-=.4");
  burger.addEventListener("click", () => menuOpen ? closeMenu() : openMenu());
  function openMenu() {
    menuOpen = true; burger.classList.add("is-open"); menu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true"); menu.setAttribute("aria-hidden", "false");
    lenis?.stop(); menuTl.timeScale(1).play();
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false; burger.classList.remove("is-open"); menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false"); menu.setAttribute("aria-hidden", "true");
    lenis?.start(); menuTl.timeScale(1.6).reverse();
  }

  /* ---------- Hero : parallax scroll + souris ---------- */
  gsap.to(".hero-media", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-content", { yPercent: -25, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".sash-hero", { xPercent: 20, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  if (!isTouch) {
    const hero = $("#hero");
    hero.addEventListener("mousemove", e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      gsap.to(".hero-img", { x: nx * -30, y: ny * -20, duration: 1.2, ease: "power3.out" });
      gsap.to(".hero-badge", { x: nx * 40, y: ny * 40, duration: 1.2, ease: "power3.out" });
      gsap.to(".ht-big", { x: nx * 18, duration: 1.2, ease: "power3.out" });
    });
  }

  /* ---------- Particules dorées ---------- */
  function particles(canvas, count) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, pts = [], mouse = { x: -999, y: -999 }, visible = false;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); addEventListener("resize", resize);
    for (let i = 0; i < count; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2.2 + .4, vy: -(Math.random() * .5 + .15), vx: (Math.random() - .5) * .3, a: Math.random() * .7 + .2, t: Math.random() * 6 });
    canvas.parentElement.addEventListener("mousemove", e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    ScrollTrigger.create({ trigger: canvas.parentElement, start: "top bottom", end: "bottom top", onToggle: s => visible = s.isActive });
    gsap.ticker.add(() => {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.t += .02; p.x += p.vx + Math.sin(p.t) * .2; p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120) { p.x += dx / d * 2; p.y += dy / d * 2; }
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246,215,124,${p.a * (.6 + Math.sin(p.t * 2) * .4)})`;
        ctx.shadowBlur = 8; ctx.shadowColor = "rgba(227,179,74,.8)";
        ctx.fill();
      }
    });
  }
  if (!reduced) {
    particles($("#heroParticles"), innerWidth < 700 ? 45 : 90);
    particles($("#footParticles"), innerWidth < 700 ? 30 : 60);
  }

  /* ---------- Marquees (vitesse liée au scroll) ---------- */
  $$(".marquee").forEach(m => {
    const track = $(".marquee-track", m);
    const dir = +m.dataset.dir || -1;
    let x = 0, boost = 0, sign = 1;
    const half = () => track.scrollWidth / 2;
    gsap.ticker.add((t, dt) => {
      const v = lenis ? lenis.velocity : 0;
      if (v) sign = Math.sign(v);
      boost += (Math.min(Math.abs(v), 40) - boost) * .1;
      x += dir * sign * (0.05 + boost * .02) * dt;
      const h = half();
      if (x <= -h) x += h; if (x > 0) x -= h;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  });
  gsap.from(".m-gold", { xPercent: -30, rotate: -8, scrollTrigger: { trigger: ".marquees", start: "top bottom", end: "center center", scrub: 1 } });
  gsap.from(".m-dark", { xPercent: 30, rotate: 8, scrollTrigger: { trigger: ".marquees", start: "top bottom", end: "center center", scrub: 1 } });

  /* ---------- Titres : mots qui montent ---------- */
  $$(".split-words").forEach(el => {
    gsap.from($$(".word-in", el), {
      yPercent: 115, rotate: 6, duration: 1.2, ease: "expo.out", stagger: .07,
      scrollTrigger: { trigger: el, start: "top 85%" }
    });
  });
  $$(".eyebrow").forEach(el => {
    gsap.from(el, { opacity: 0, x: -30, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    gsap.from($("span", el), { rotate: -180, scale: 0, duration: 1.2, ease: "back.out(2)", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ---------- Manifesto : remplissage mot à mot ---------- */
  gsap.to($$(".fw", manifesto), {
    opacity: 1, stagger: .1, ease: "none",
    scrollTrigger: { trigger: manifesto, start: "top 80%", end: "bottom 45%", scrub: true }
  });
  // mots-clés en or
  $$(".fw", manifesto).forEach(w => { if (/^(jaune|noir|ensemble,|ensemble|fierté\.|Brugheas,|buvette\.)$/i.test(w.textContent)) w.classList.add("gold"); });

  /* ---------- Compteurs ---------- */
  $$(".count").forEach(el => {
    const to = +el.dataset.to, o = { v: 0 };
    gsap.to(o, {
      v: to, duration: to > 50 ? 2.4 : 1.6, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate: () => el.textContent = Math.round(o.v)
    });
  });
  gsap.from(".stat", { y: 60, opacity: 0, duration: 1, stagger: .12, ease: "expo.out", scrollTrigger: { trigger: ".stats", start: "top 85%" } });

  /* ---------- Équipes ---------- */
  $$(".team-panel").forEach((p, i) => {
    gsap.fromTo(p, { clipPath: "inset(100% 0% 0% 0% round 26px)" }, {
      clipPath: "inset(0% 0% 0% 0% round 26px)", duration: 1.6, ease: "expo.inOut", delay: i * .15,
      scrollTrigger: { trigger: ".team-panels", start: "top 80%" }
    });
    gsap.fromTo($(".tp-media img", p), { yPercent: -12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from($$(".tp-tag, h3, .tp-facts", p), { y: 50, opacity: 0, duration: 1.1, stagger: .1, ease: "expo.out", delay: .6 + i * .15, scrollTrigger: { trigger: ".team-panels", start: "top 80%" } });
    gsap.from($(".tp-index", p), { xPercent: 100, opacity: 0, duration: 1.4, ease: "expo.out", delay: .8, scrollTrigger: { trigger: ".team-panels", start: "top 80%" } });
    // tilt 3D
    if (!isTouch) {
      p.addEventListener("mousemove", e => {
        const r = p.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        gsap.to($(".tp-media img", p), { x: nx * -24, y: ny * -24, duration: .8, ease: "power3.out" });
        gsap.to($(".tp-content", p), { x: nx * 14, y: ny * 10, duration: .8, ease: "power3.out" });
      });
      p.addEventListener("mouseleave", () => gsap.to([$(".tp-media img", p), $(".tp-content", p)], { x: 0, y: 0, duration: 1, ease: "power3.out" }));
    }
  });

  /* ---------- Matchs du week-end ---------- */
  gsap.from(".fixture", { y: 80, opacity: 0, rotateX: -30, transformPerspective: 900, duration: 1.2, stagger: .15, ease: "expo.out", scrollTrigger: { trigger: "#fixtureList", start: "top 85%" } });
  gsap.from(".fx-vs", { scale: 0, rotate: -360, duration: 1.4, stagger: .15, ease: "back.out(1.8)", scrollTrigger: { trigger: "#fixtureList", start: "top 85%" } });

  /* ---------- Saison : scroll horizontal épinglé ---------- */
  const track = $("#seasonTrack");
  const dist = () => track.scrollWidth - innerWidth;
  const hScroll = gsap.to(track, {
    x: () => -dist(), ease: "none",
    scrollTrigger: {
      trigger: ".season", pin: ".season-pin", start: "top top", end: () => "+=" + dist(),
      scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: s => gsap.set("#seasonBar", { scaleX: s.progress })
    }
  });
  gsap.from(".season-title, .season-hint", { y: 60, opacity: 0, duration: 1.2, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: ".season", start: "top 70%" } });
  $$(".s-card").forEach(card => {
    gsap.fromTo(card, { rotate: 6, y: 80, opacity: .2, scale: .88 }, {
      rotate: 0, y: 0, opacity: 1, scale: 1, ease: "power2.out",
      scrollTrigger: { trigger: card, containerAnimation: hScroll, start: "left 105%", end: "left 55%", scrub: true }
    });
    gsap.fromTo($("img", card), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: card, containerAnimation: hScroll, start: "left right", end: "right left", scrub: true } });
    const res = $(".s-result", card);
    if (res) gsap.from(res, { scale: 0, rotate: -40, ease: "back.out(2.5)", duration: .8, scrollTrigger: { trigger: card, containerAnimation: hScroll, start: "left 70%" } });
  });

  /* ---------- Score 2-8 : cartes en éventail ---------- */
  gsap.from(".score-board .sb-team", { opacity: 0, y: 40, duration: 1.2, stagger: .2, ease: "expo.out", scrollTrigger: { trigger: ".score-board", start: "top 80%" } });
  gsap.from(".sb-nums", { scale: .6, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".score-board", start: "top 80%" } });
  gsap.from(".sb-sep", { rotate: 180, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".score-board", start: "top 80%" } });
  const cards = $$(".goal-card");
  const spread = () => Math.min(innerWidth * .23, 330);
  gsap.matchMedia()
    .add("(min-width: 701px)", () => {
      // grand écran : les affiches s'écartent en éventail
      gsap.set(cards, { rotate: (i) => (i - 1.5) * 3, y: 60 });
      gsap.timeline({ scrollTrigger: { trigger: "#goalCards", start: "top 85%", end: "center 45%", scrub: 1, invalidateOnRefresh: true } })
        .to(cards, {
          x: i => (i - 1.5) * spread(),
          y: i => Math.abs(i - 1.5) * 34,
          rotate: i => (i - 1.5) * 9,
          ease: "power2.out", stagger: 0
        });
    })
    .add("(max-width: 700px)", () => {
      // téléphone : grille 2×2 qui se retourne
      gsap.from(cards, {
        y: 80, rotateY: 90, opacity: 0, transformPerspective: 800, duration: 1.1, ease: "expo.out",
        stagger: .12, scrollTrigger: { trigger: "#goalCards", start: "top 85%" }
      });
    });
  cards.forEach(c => {
    c.addEventListener("mouseenter", () => gsap.to(c, { scale: 1.08, zIndex: 5, duration: .5, ease: "power3.out" }));
    c.addEventListener("mouseleave", () => gsap.to(c, { scale: 1, zIndex: 1, duration: .5, ease: "power3.out" }));
  });

  /* ---------- Images : révélation en rideau ---------- */
  $$(".reveal-img").forEach(w => {
    const img = $("img, iframe", w);
    gsap.timeline({ scrollTrigger: { trigger: w, start: "top 85%" } })
      .fromTo(w, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" })
      .fromTo(img, { scale: 1.4 }, { scale: 1, duration: 1.8, ease: "expo.out" }, "<.2");
  });
  gsap.from(".pill", { x: 60, opacity: 0, duration: 1, stagger: .12, ease: "expo.out", scrollTrigger: { trigger: ".join-pills", start: "top 85%" } });
  gsap.from(".join-script", { opacity: 0, rotate: -12, scale: .8, duration: 1.2, ease: "back.out(2)", scrollTrigger: { trigger: ".join-script", start: "top 90%" } });
  gsap.to(".join-media img", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".join", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- École de foot ---------- */
  gsap.from(schoolChars, {
    yPercent: 120, rotate: () => gsap.utils.random(-25, 25), duration: 1.2, ease: "back.out(1.6)",
    stagger: { each: .035, from: "random" },
    scrollTrigger: { trigger: ".school-title", start: "top 85%" }
  });
  gsap.from(".school-list li", { x: -40, opacity: 0, duration: .9, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".school-list", start: "top 85%" } });
  gsap.fromTo("#ball", { x: () => -innerWidth * .9, rotate: -720 }, {
    x: 0, rotate: 0, ease: "none",
    scrollTrigger: { trigger: ".school", start: "top bottom", end: "top 20%", scrub: 1 }
  });
  gsap.to("#ball", { y: -40, duration: .45, ease: "power1.out", yoyo: true, repeat: -1 });
  [".sp1", ".sp2", ".sp3"].forEach((s, i) => gsap.to(s, { y: [-40, 60, -20][i], rotate: [-2, 3, -1.5][i], ease: "none", scrollTrigger: { trigger: ".school-photos", start: "top bottom", end: "bottom top", scrub: true } }));

  /* ---------- Galerie : colonnes en parallaxe ---------- */
  $$(".g-col").forEach(col => {
    const sp = +col.dataset.speed;
    gsap.fromTo(col, { y: () => innerHeight * sp * -2 }, { y: () => innerHeight * sp * 2, ease: "none", scrollTrigger: { trigger: ".gallery", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
  });
  $$(".gallery figure").forEach(f => {
    gsap.fromTo(f, { clipPath: "inset(30% 10% 30% 10% round 16px)", opacity: 0 }, { clipPath: "inset(0% 0% 0% 0% round 16px)", opacity: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 95%" } });
  });

  /* ---------- Lightbox ---------- */
  const figs = $$(".gallery figure");
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  let lbIndex = 0;
  const showLb = i => {
    lbIndex = (i + figs.length) % figs.length;
    const img = $("img", figs[lbIndex]);
    lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = $("figcaption", figs[lbIndex])?.textContent || "";
    gsap.fromTo(lbImg, { scale: .85, opacity: 0, rotate: -2 }, { scale: 1, opacity: 1, rotate: 0, duration: .7, ease: "expo.out" });
    gsap.fromTo(lbCap, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6, delay: .15, ease: "expo.out" });
  };
  figs.forEach((f, i) => f.addEventListener("click", () => {
    lb.setAttribute("aria-hidden", "false"); lenis?.stop();
    gsap.to(lb, { autoAlpha: 1, duration: .4 });
    showLb(i);
  }));
  const closeLb = () => { gsap.to(lb, { autoAlpha: 0, duration: .4 }); lb.setAttribute("aria-hidden", "true"); lenis?.start(); };
  $(".lb-close").addEventListener("click", closeLb);
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  $(".lb-prev").addEventListener("click", () => showLb(lbIndex - 1));
  $(".lb-next").addEventListener("click", () => showLb(lbIndex + 1));
  addEventListener("keydown", e => {
    if (lb.getAttribute("aria-hidden") === "true") { if (e.key === "Escape") closeMenu(); return; }
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
  });

  /* ---------- Stade ---------- */
  gsap.from(".stadium-list li", { y: 30, opacity: 0, duration: 1, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: ".stadium-list", start: "top 88%" } });

  /* ---------- Contact ---------- */
  gsap.from(".contact-title .shine", { yPercent: 100, skewY: 8, opacity: 0, duration: 1.4, stagger: .15, ease: "expo.out", scrollTrigger: { trigger: ".contact-title", start: "top 85%" } });
  gsap.from(".ccard", { y: 80, opacity: 0, rotate: 3, duration: 1.2, stagger: .12, ease: "expo.out", scrollTrigger: { trigger: ".contact-cards", start: "top 90%" } });

  /* ---------- Rafraîchir après chargement des images ---------- */
  addEventListener("load", () => ScrollTrigger.refresh());
}

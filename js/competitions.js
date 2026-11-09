/* =========================================================
   A.S. BRUGHEAS — Calendrier, résultats & classements
   Données officielles en direct : API publique de la FFF
   (la même que celle du site du District de l'Allier).
   ========================================================= */

const API = "https://api-dofa.fff.fr/api";
const CLUB = 204004;                       // numéro FFF de l'A.S. Brugheas
const ASB_LOGO = "assets/img/logo.png";

/* Chaque saison : mettre à jour les numéros de compétition / poule
   (visibles dans l'adresse de la page « Compétitions » du District). */
const TEAMS = {
  sem: {
    label: "Seniors",
    compet: 452096, phase: 1, poule: 4,
    title: "Départemental 5 · Poule D",
    cups: [449168, 452108, 460004]
  },
  sef: {
    label: "Féminines",
    compet: 452107, phase: 1, poule: 3,
    title: "Féminines Seniors à 8 · Poule 3",
    cups: [458930]
  }
};
const COMP_NAMES = {
  449168: "Coupe de France",
  452096: "Championnat D5",
  452108: "Challenge Jean-Vidal",
  460004: "Challenge Paul-Baptiste",
  452107: "Championnat à 8",
  458930: "Challenge Lanoix à 8"
};

/* --------------------------------------------------------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const hasGsap = !!(window.gsap && window.ScrollTrigger);
const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (hasGsap) gsap.registerPlugin(ScrollTrigger);
$("#year").textContent = new Date().getFullYear();

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Accès API ---------- */
async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + " " + url);
  return r.json();
}
async function getAll(path) {
  let out = [], page = 1;
  while (page < 15) {
    const d = await getJSON(`${API}${path}${path.includes("?") ? "&" : "?"}page=${page}`);
    const m = d["hydra:member"] || [];
    out = out.concat(m);
    if (!m.length || out.length >= (d["hydra:totalItems"] ?? 0)) break;
    page++;
  }
  return out;
}

/* ---------- Helpers matchs ---------- */
const isAsb = t => t?.club?.cl_no === CLUB;
const teamKey = t => t ? `${t.club?.cl_no}-${t.code ?? 1}` : "?";
const teamName = t => {
  if (!t) return "Exempt";
  const n = (t.short_name || "").trim();
  return t.code > 1 ? `${n} ${t.code}` : n;
};
const prettyName = n => n.replace(/\s+/g, " ").trim();
function matchDate(m) {
  const ymd = (m.date || "").slice(0, 10);
  const [hh, mm] = (m.time || "15H00").toUpperCase().split("H");
  return new Date(`${ymd}T${(hh || "15").padStart(2, "0")}:${(mm || "00").padStart(2, "0")}:00`);
}
const isPlayed = m => m.home_score != null && m.away_score != null;
function asbOutcome(m) {
  if (!isPlayed(m)) return null;
  const home = isAsb(m.home);
  const a = home ? m.home_score : m.away_score, b = home ? m.away_score : m.home_score;
  if (a === b) {
    if (m.home_nb_tir_but != null && m.away_nb_tir_but != null) {
      const pa = home ? m.home_nb_tir_but : m.away_nb_tir_but, pb = home ? m.away_nb_tir_but : m.home_nb_tir_but;
      return pa > pb ? "w" : "l";
    }
    return "d";
  }
  return a > b ? "w" : "l";
}
function outcomeFor(m, key) {
  if (!isPlayed(m)) return null;
  const home = teamKey(m.home) === key;
  const a = home ? m.home_score : m.away_score, b = home ? m.away_score : m.home_score;
  return a === b ? "d" : a > b ? "w" : "l";
}
const DAY = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const DAY_LONG = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtTime = m => (m.time || "").replace("H", "h");

/* ---------- Logos ---------- */
const logoMap = {}; // cl_no -> url
function logo(t, cls = "") {
  const name = teamName(t);
  if (isAsb(t)) return `<span class="logo is-asb ${cls}"><img src="${ASB_LOGO}" alt="" loading="lazy"></span>`;
  const url = t?.club?.logo || logoMap[t?.club?.cl_no];
  const ini = esc(name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(" ").filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("") || "?");
  if (!url) return `<span class="logo ${cls}"><span class="initials">${ini}</span></span>`;
  return `<span class="logo ${cls}"><img src="${esc(url)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'initials',textContent:'${ini}'}))"></span>`;
}

/* ---------- État ---------- */
const store = { club: null, teams: {} };
let current = "sem";

async function loadClub() {
  if (!store.club) store.club = await getAll(`/clubs/${CLUB}/matchs`);
  return store.club;
}
async function loadTeam(id) {
  if (store.teams[id]) return store.teams[id];
  const T = TEAMS[id];
  const base = `/compets/${T.compet}/phases/${T.phase}/poules/${T.poule}`;
  const [rank, poule] = await Promise.all([getAll(`${base}/classement_journees`), getAll(`${base}/matchs`)]);
  poule.forEach(m => [m.home, m.away].forEach(t => { if (t?.club?.logo) logoMap[t.club.cl_no] = t.club.logo; }));
  return (store.teams[id] = { rank, poule });
}

/* ---------- Rendu ---------- */
function render(id, dir = 0) {
  const T = TEAMS[id];
  const { rank, poule } = store.teams[id];
  const comps = [T.compet, ...T.cups];
  const mine = store.club.filter(m => comps.includes(m.competition?.cp_no)).sort((a, b) => matchDate(a) - matchDate(b));

  /* Source & mise à jour */
  $("#sourceLink").href = `https://allier.fff.fr/competitions?tab=ranking&id=${T.compet}&phase=${T.phase}&poule=${T.poule}&type=ch`;
  const upd = rank.map(r => r.external_updated_at).filter(Boolean).sort().pop();
  $("#updatedAt").textContent = upd ? "Mis à jour le " + DAY_LONG.format(new Date(upd)) : "";

  /* Résumé */
  const me = rank.find(r => r.equipe?.club?.cl_no === CLUB);
  const sumEl = $("#summary");
  if (me) {
    const tiles = [
      [me.rank, me.rank === 1 ? "er" : "e", "Place · " + T.title.split("·")[0].trim()],
      [me.point_count, "", "Points"],
      [me.won_games_count, "", `Victoires · ${me.draw_games_count} N · ${me.lost_games_count} D`],
      [me.goals_for_count, "", "Buts marqués"],
      [me.goals_against_count, "", "Buts encaissés"]
    ];
    sumEl.innerHTML = tiles.map(([n, sup, l]) => `<div class="sum"><b><span class="cnt" data-to="${n}">${n}</span>${sup ? `<sup>${sup}</sup>` : ""}</b><span>${esc(l)}</span></div>`).join("");
  } else sumEl.innerHTML = "";

  /* Prochain match */
  const now = Date.now();
  const next = mine.find(m => !isPlayed(m) && matchDate(m).getTime() > now - 2 * 36e5);
  const nm = $("#nextMatch");
  if (next) {
    const home = isAsb(next.home);
    nm.innerHTML = `
      <div class="next">
        <div class="next-top">
          <span class="tag">${esc(COMP_NAMES[next.competition?.cp_no] || next.competition?.name)}${next.poule_journee?.number && next.competition?.cp_no === T.compet ? " · J" + next.poule_journee.number : ""}</span>
          <span class="tag ${home ? "home" : ""}">${home ? "À domicile" : "À l'extérieur"}</span>
        </div>
        <div class="next-teams">
          <div class="nt">${logo(next.home, "xl")}<span class="nt-name ${isAsb(next.home) ? "asb" : ""}">${esc(teamName(next.home))}</span></div>
          <div class="nt-vs">VS</div>
          <div class="nt">${logo(next.away, "xl")}<span class="nt-name ${isAsb(next.away) ? "asb" : ""}">${esc(teamName(next.away))}</span></div>
        </div>
        <div class="countdown" data-date="${matchDate(next).toISOString()}"></div>
        <p class="next-info"><b>${esc(cap(DAY_LONG.format(matchDate(next))))} · ${esc(fmtTime(next))}</b><br>${esc(next.terrain ? prettyName(`${next.terrain.name}, ${next.terrain.city}`) : "Lieu à confirmer")}</p>
      </div>`;
  } else nm.innerHTML = `<p class="next-empty">Aucun match programmé pour le moment. Revenez bientôt !</p>`;
  tickCountdown();

  /* Classement */
  $("#rankTitle").textContent = T.title;
  $("#rankSub").textContent = `${rank.length} équipes · ${Math.max(...rank.map(r => r.total_games_count || 0))} journées jouées`;
  const played = poule.filter(isPlayed).sort((a, b) => matchDate(a) - matchDate(b));
  const maxPts = Math.max(1, ...rank.map(r => r.point_count));
  $("#rankTable tbody").innerHTML = [...rank].sort((a, b) => a.rank - b.rank).map(r => {
    const t = r.equipe;
    const key = teamKey(t);
    const form = played.filter(m => teamKey(m.home) === key || teamKey(m.away) === key).slice(-5).map(m => outcomeFor(m, key));
    const diff = r.goals_for_count - r.goals_against_count; // goals_diff de l'API n'a pas de signe
    const pen = r.penalty_point_count ? ` title="${r.penalty_point_count} point(s) de pénalité"` : "";
    return `<tr class="${t?.club?.cl_no === CLUB ? "is-asb" : ""}">
      <td><span class="pos">${r.rank}</span></td>
      <td><div class="team-cell">${logo(t)}<span class="nm">${esc(teamName(t))}</span></div></td>
      <td class="pts"${pen}><span class="pts-wrap">${r.point_count}${r.penalty_point_count ? "*" : ""}<span class="pts-bar"><i style="transform:scaleX(${r.point_count / maxPts})"></i></span></span></td>
      <td>${r.total_games_count}</td><td>${r.won_games_count}</td><td>${r.draw_games_count}</td><td>${r.lost_games_count}</td>
      <td class="t-opt">${r.goals_for_count}</td><td class="t-opt">${r.goals_against_count}</td>
      <td class="diff ${diff > 0 ? "pos-d" : diff < 0 ? "neg-d" : ""}">${diff > 0 ? "+" : ""}${diff}</td>
      <td class="t-form"><span class="form">${form.map(f => `<i class="${f}">${{ w: "V", d: "N", l: "D" }[f]}</i>`).join("")}</span></td>
    </tr>`;
  }).join("");

  /* Calendrier & résultats ASB */
  renderMatches(mine, next);

  /* Journées */
  buildDays(poule);

  /* Bandeau logos */
  const uniq = [...new Map(poule.flatMap(m => [m.home, m.away]).filter(Boolean).map(t => [teamKey(t), t])).values()];
  const items = uniq.map(t => `<span class="lm-item">${logo(t)}${esc(teamName(t))}</span><b>★</b>`).join("");
  $("#logoTrack").innerHTML = items + items;

  animateIn(dir);
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

let currentFilter = "all";
function renderMatches(mine, next) {
  const T = TEAMS[current];
  const list = mine.filter(m => {
    if (currentFilter === "done") return isPlayed(m);
    if (currentFilter === "todo") return !isPlayed(m);
    if (currentFilter === "cup") return m.competition?.cp_no !== T.compet;
    return true;
  });
  $("#matchList").innerHTML = list.length ? list.map(m => {
    const out = asbOutcome(m);
    const d = matchDate(m);
    const cup = m.competition?.cp_no !== T.compet;
    let score;
    if (isPlayed(m)) {
      const tab = m.home_nb_tir_but != null && m.away_nb_tir_but != null ? `<small>tab ${m.home_nb_tir_but}-${m.away_nb_tir_but}</small>` : "";
      const ff = m.home_is_forfeit === "O" || m.away_is_forfeit === "O" ? "<small>forfait</small>" : "";
      score = `<div class="m-score ${out}">${m.home_score} - ${m.away_score}${tab}${ff}</div>`;
    } else if (d.getTime() < Date.now() - 3 * 36e5) score = `<div class="m-score todo">—</div>`;
    else score = `<div class="m-score todo">${esc(fmtTime(m))}</div>`;
    const label = cup ? COMP_NAMES[m.competition?.cp_no] || m.competition?.name : `Journée ${m.poule_journee?.number ?? ""}`;
    return `<li class="mrow ${next && m.ma_no === next.ma_no ? "is-next" : ""}">
      <div class="m-date">${esc(DAY.format(d).replace(".", ""))}<small>${d.getFullYear()} · ${esc(fmtTime(m))}</small></div>
      <div class="m-team home ${isAsb(m.home) ? "asb" : ""}"><span class="tn">${esc(teamName(m.home))}</span>${logo(m.home)}</div>
      ${score}
      <div class="m-team away ${isAsb(m.away) ? "asb" : ""}">${logo(m.away)}<span class="tn">${esc(teamName(m.away))}</span></div>
      <div class="m-meta"><span class="tag ${cup ? "cup" : ""}">${esc(label)}</span><br>${esc(m.terrain?.city ? cap(m.terrain.city.toLowerCase()) : "")}</div>
    </li>`;
  }).join("") : `<li class="next-empty">Aucun match dans cette catégorie.</li>`;
}

/* ---------- Journées ---------- */
let days = [], dayIdx = 0;
function buildDays(poule) {
  const by = {};
  poule.forEach(m => { const n = m.poule_journee?.number; if (n) (by[n] ||= []).push(m); });
  days = Object.keys(by).map(Number).sort((a, b) => a - b).map(n => ({ n, matches: by[n].sort((a, b) => matchDate(a) - matchDate(b)) }));
  // journée affichée par défaut : la dernière avec des scores
  const lastPlayed = days.map((d, i) => d.matches.some(isPlayed) ? i : -1).filter(i => i >= 0).pop();
  dayIdx = lastPlayed ?? 0;
  $("#dayDots").innerHTML = days.map((d, i) => `<button class="${d.matches.some(isPlayed) ? "played" : ""}" data-i="${i}" aria-label="Journée ${d.n}">${d.n}</button>`).join("");
  renderDay(0);
}
function renderDay(dir) {
  const d = days[dayIdx];
  if (!d) return;
  $("#dayNum").textContent = d.n;
  const first = matchDate(d.matches[0]);
  $("#dayDate").textContent = cap(new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(first));
  $("#dayPrev").disabled = dayIdx === 0;
  $("#dayNext").disabled = dayIdx === days.length - 1;
  $$("#dayDots button").forEach((b, i) => b.classList.toggle("is-active", i === dayIdx));
  const grid = $("#dayGrid");
  const html = d.matches.map(m => {
    const p = isPlayed(m);
    const hw = p && m.home_score > m.away_score, aw = p && m.away_score > m.home_score;
    return `<div class="dcard ${isAsb(m.home) || isAsb(m.away) ? "has-asb" : ""}">
      <div class="dt ${isAsb(m.home) ? "asb" : ""} ${hw ? "win" : aw ? "lose" : ""}">${logo(m.home)}${esc(teamName(m.home))}</div>
      <div class="d-mid"><div class="d-score ${p ? "" : "todo"}" ${!p && matchDate(m).getTime() < Date.now() - 3 * 36e5 ? 'title="Score non communiqué"' : ""}>${p ? `${m.home_score} - ${m.away_score}` : matchDate(m).getTime() < Date.now() - 3 * 36e5 ? "—" : esc(fmtTime(m))}</div><div class="d-when">${esc(DAY.format(matchDate(m)).replace(".", ""))}</div></div>
      <div class="dt ${isAsb(m.away) ? "asb" : ""} ${aw ? "win" : hw ? "lose" : ""}">${logo(m.away)}${esc(teamName(m.away))}</div>
    </div>`;
  }).join("");
  if (hasGsap && dir && !reduced) {
    gsap.to(grid.children, {
      x: -60 * dir, opacity: 0, duration: .25, stagger: .02, ease: "power2.in",
      onComplete: () => {
        grid.innerHTML = html;
        gsap.fromTo(grid.children, { x: 60 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .6, stagger: .05, ease: "expo.out" });
      }
    });
    gsap.fromTo("#dayNum", { yPercent: 60 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: "expo.out" });
  } else grid.innerHTML = html;
}
$("#dayPrev").addEventListener("click", () => { if (dayIdx > 0) { dayIdx--; renderDay(-1); } });
$("#dayNext").addEventListener("click", () => { if (dayIdx < days.length - 1) { dayIdx++; renderDay(1); } });
$("#dayDots").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const i = +b.dataset.i; if (i === dayIdx) return;
  const dir = i > dayIdx ? 1 : -1; dayIdx = i; renderDay(dir);
});

/* ---------- Filtres ---------- */
$$(".chip-btn").forEach(b => b.addEventListener("click", () => {
  $$(".chip-btn").forEach(x => x.classList.toggle("is-active", x === b));
  currentFilter = b.dataset.filter;
  const T = TEAMS[current];
  const comps = [T.compet, ...T.cups];
  const mine = store.club.filter(m => comps.includes(m.competition?.cp_no)).sort((a, b) => matchDate(a) - matchDate(b));
  const next = mine.find(m => !isPlayed(m) && matchDate(m).getTime() > Date.now() - 2 * 36e5);
  renderMatches(mine, next);
  if (hasGsap && !reduced) gsap.from("#matchList > li", { y: 30, opacity: 0, duration: .6, stagger: .04, ease: "expo.out" });
}));

/* ---------- Compte à rebours ---------- */
function tickCountdown() {
  const el = $(".countdown"); if (!el) return;
  const diff = new Date(el.dataset.date).getTime() - Date.now();
  if (diff <= 0) { el.innerHTML = diff > -2 * 36e5 ? `<span class="fx-status live">Match en cours</span>` : ""; return; }
  const p = n => String(n).padStart(2, "0");
  const v = [Math.floor(diff / 864e5), Math.floor(diff / 36e5) % 24, Math.floor(diff / 6e4) % 60, Math.floor(diff / 1e3) % 60];
  const html = v.map((n, i) => `<div><b>${p(n)}</b><small>${["JOURS", "HEURES", "MIN", "SEC"][i]}</small></div>`).join("");
  if (el.innerHTML !== html) el.innerHTML = html;
}
setInterval(tickCountdown, 1000);

/* ---------- Sélecteur d'équipe ---------- */
function moveIndicator(btn, instant) {
  const ind = $(".ts-indicator");
  const r = btn.getBoundingClientRect(), pr = btn.parentElement.getBoundingClientRect();
  const props = { x: r.left - pr.left - 6, width: r.width };
  if (hasGsap && !instant) gsap.to(ind, { ...props, duration: .7, ease: "expo.out" });
  else { ind.style.width = props.width + "px"; ind.style.transform = `translateX(${props.x}px)`; }
}
$$(".ts-btn").forEach(btn => btn.addEventListener("click", async () => {
  const id = btn.dataset.team;
  if (id === current) return;
  const dir = id === "sef" ? 1 : -1;
  current = id;
  $$(".ts-btn").forEach(b => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-selected", b === btn); });
  moveIndicator(btn);
  try { history.replaceState(null, "", id === "sef" ? "#feminines" : "#seniors"); } catch (e) {}
  const content = $("#cContent");
  if (hasGsap) await gsap.to(content, { opacity: 0, y: 20, duration: .3, ease: "power2.in" });
  try {
    if (!store.teams[id]) setStatus("loading");
    await loadTeam(id);
    setStatus("ok");
    render(id, dir);
  } catch (e) { setStatus("error"); console.error(e); }
  if (hasGsap) gsap.to(content, { opacity: 1, y: 0, duration: .5, ease: "expo.out" });
}));
addEventListener("resize", () => moveIndicator($(".ts-btn.is-active"), true));

function setStatus(s) {
  const st = $("#cStatus");
  if (s === "ok") { st.hidden = true; $("#cContent").hidden = false; return; }
  st.hidden = false;
  if (s === "loading") { st.className = "c-status"; st.innerHTML = `<span class="loader"></span> Chargement des données officielles de la FFF…`; }
  if (s === "error") {
    st.className = "c-status is-error";
    const T = TEAMS[current];
    st.innerHTML = `Les données de la FFF sont momentanément indisponibles. Consultez le classement directement sur le <a href="https://allier.fff.fr/competitions?tab=ranking&id=${T.compet}&phase=${T.phase}&poule=${T.poule}&type=ch" target="_blank" rel="noopener">site du District de l'Allier</a>.`;
  }
}

/* ---------- Animations d'entrée ---------- */
let firstRender = true;
function animateIn() {
  if (!hasGsap || reduced) return;
  $$(".cnt").forEach(el => {
    const o = { v: 0 }, to = +el.dataset.to;
    gsap.to(o, { v: to, duration: 1.4, ease: "power3.out", onUpdate: () => el.textContent = Math.round(o.v) });
  });
  gsap.from(".sum", { y: 50, opacity: 0, rotateX: -40, transformPerspective: 800, duration: 1, stagger: .08, ease: "expo.out" });
  const scrollOpts = trig => firstRender ? { scrollTrigger: { trigger: trig, start: "top 88%" } } : {};
  gsap.from(".next", { y: 60, opacity: 0, scale: .96, duration: 1.2, ease: "expo.out", ...scrollOpts(".next") });
  gsap.from(".next .nt:first-child .logo", { x: -120, rotate: -200, opacity: 0, duration: 1.4, ease: "expo.out", ...scrollOpts(".next") });
  gsap.from(".next .nt:last-child .logo", { x: 120, rotate: 200, opacity: 0, duration: 1.4, ease: "expo.out", ...scrollOpts(".next") });
  gsap.from(".nt-vs", { scale: 3, opacity: 0, duration: .9, delay: .3, ease: "back.out(2)", ...scrollOpts(".next") });
  gsap.from("#rankTable tbody tr", { x: -40, opacity: 0, duration: .8, stagger: .05, ease: "expo.out", ...scrollOpts("#rankTable") });
  gsap.from(".pts-bar i", { scaleX: 0, duration: 1.4, stagger: .05, ease: "expo.out", ...scrollOpts("#rankTable") });
  gsap.from(".form i", { scale: 0, duration: .5, stagger: .015, ease: "back.out(3)", ...scrollOpts("#rankTable") });
  gsap.from("#matchList > li", { y: 40, opacity: 0, duration: .8, stagger: .04, ease: "expo.out", ...scrollOpts("#matchList") });
  gsap.from("#dayGrid > *", { y: 40, opacity: 0, duration: .8, stagger: .06, ease: "expo.out", ...scrollOpts("#dayGrid") });
  if (firstRender) $$(".c-block .eyebrow, .block-title").forEach(el => gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
  firstRender = false;
  ScrollTrigger.refresh();
}

/* ---------- Habillage commun : smooth scroll, curseur, nav, menu ---------- */
let lenis = null;
if (hasGsap && window.Lenis && !reduced) {
  lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
if (hasGsap) {
  // Titre
  $$(".ct-line").forEach(line => {
    line.innerHTML = [...line.textContent].map(c => `<span class="char">${c === " " ? "&nbsp;" : c}</span>`).join("");
  });
  gsap.from(".ct-line .char", { yPercent: 110, rotate: 10, duration: 1.2, ease: "expo.out", stagger: .025, delay: .1 });
  gsap.from(".c-hero .eyebrow, .c-lead, .team-switch", { y: 30, opacity: 0, duration: 1, stagger: .1, delay: .5, ease: "expo.out" });
  gsap.fromTo(".c-hero-bg img", { scale: 1.3 }, { scale: 1, duration: 2.4, ease: "expo.out" });
  gsap.fromTo("#fbFloat", { autoAlpha: 0, scale: 0, rotate: -180 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.2, delay: 1, ease: "back.out(1.8)" });

  // Barre de progression + nav
  const nav = $("#nav");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: s => {
      nav.classList.toggle("is-hidden", s.direction === 1 && s.scroll() > 400 && !menuOpen);
      gsap.set("#progress", { scaleX: s.progress });
    }
  });

  // Bandeau logos qui défile
  const track = $("#logoTrack");
  let x = 0;
  gsap.ticker.add((t, dt) => {
    const v = lenis ? Math.min(Math.abs(lenis.velocity), 40) : 0;
    x -= (0.05 + v * .02) * dt;
    const h = track.scrollWidth / 2;
    if (h && x <= -h) x += h;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
}

// Curseur
if (!isTouch && hasGsap) {
  const cur = $("#cursor"), dot = $("#cursorDot");
  const xTo = gsap.quickTo(cur, "x", { duration: .45, ease: "power3" }), yTo = gsap.quickTo(cur, "y", { duration: .45, ease: "power3" });
  const dx = gsap.quickTo(dot, "x", { duration: .08 }), dy = gsap.quickTo(dot, "y", { duration: .08 });
  addEventListener("mousemove", e => { document.body.classList.add("has-mouse"); xTo(e.clientX); yTo(e.clientY); dx(e.clientX); dy(e.clientY); });
  document.addEventListener("mouseover", e => {
    cur.classList.toggle("is-hover", !!e.target.closest("a, button, .mrow, .dcard"));
  });
  $$(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .3, duration: .5, ease: "power3.out" });
    });
    btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: .9, ease: "elastic.out(1, .35)" }));
  });
}

// Menu mobile
let menuOpen = false;
const burger = $("#burger"), menu = $("#menu");
const menuTl = hasGsap ? gsap.timeline({ paused: true })
  .to(".menu-bg", { clipPath: "circle(150% at calc(100% - 40px) 38px)", duration: .9, ease: "expo.inOut" })
  .to(".menu-links a", { opacity: 1, y: 0, duration: .7, stagger: .06, ease: "expo.out" }, "-=.4")
  .to(".menu-fb", { opacity: 1, y: 0, duration: .7, ease: "expo.out" }, "-=.45")
  .to(".menu-foot", { opacity: 1, duration: .5 }, "-=.4") : null;
burger.addEventListener("click", () => {
  menuOpen = !menuOpen;
  burger.classList.toggle("is-open", menuOpen); menu.classList.toggle("is-open", menuOpen);
  burger.setAttribute("aria-expanded", menuOpen); menu.setAttribute("aria-hidden", !menuOpen);
  if (menuOpen) { lenis?.stop(); menuTl?.timeScale(1).play(); } else { lenis?.start(); menuTl?.timeScale(1.6).reverse(); }
});
$$(".menu a").forEach(a => a.addEventListener("click", () => { if (menuOpen) burger.click(); }));

/* ---------- Démarrage ---------- */
(async function start() {
  if (location.hash === "#feminines") {
    current = "sef";
    $$(".ts-btn").forEach(b => { const on = b.dataset.team === "sef"; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
  }
  requestAnimationFrame(() => moveIndicator($(".ts-btn.is-active"), true));
  try {
    await Promise.all([loadClub(), loadTeam(current)]);
    setStatus("ok");
    render(current);
    // pré-charge l'autre équipe en arrière-plan
    loadTeam(current === "sem" ? "sef" : "sem").catch(() => {});
  } catch (e) {
    console.error(e);
    setStatus("error");
  }
})();

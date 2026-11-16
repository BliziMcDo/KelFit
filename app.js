/* Élan — logique de l'application (état local, vues, progression automatique). */
(function () {
  'use strict';
  const KEY = 'elan-v1';
  const view = document.getElementById('view');
  const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CHEV = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const CHECK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const BACK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';

  /* ---------- Dates ---------- */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  function mondayISO() { const d = today(); return iso(addDays(d, -((d.getDay() + 6) % 7))); }

  /* ---------- État ---------- */
  const defaults = () => ({ start: mondayISO(), ref10k: 2760, target10k: 2670, logs: {}, runs: {} });
  function load() { try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return defaults(); } }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { Sable.toast('Enregistrement impossible sur cet appareil'); } }

  /* ---------- Programme ---------- */
  const phaseOf = w => Math.ceil(w / 4);
  const isDeload = w => w % 4 === 0;
  const dateOf = (w, day) => addDays(parse(S.start), (w - 1) * 7 + day);
  function currentWeek() {
    const diff = Math.floor((today() - parse(S.start)) / 864e5);
    return Math.min(TOTAL_WEEKS, Math.max(1, Math.floor(diff / 7) + 1));
  }
  const isRun = k => k === 'Q' || k === 'E';
  const isDone = (w, k) => !!(isRun(k) ? S.runs[`${w}-${k}`] : S.logs[`${w}-${k}`])?.done;

  function prescription(w, role) {
    const r = { ...RULES[phaseOf(w)][role], test: false, deload: false };
    if (w === 12 && role === 'main') { r.sets = 2; r.test = true; }
    else if (isDeload(w)) { r.sets = 2; r.deload = true; }
    return r;
  }
  const snap = (ex, x) => Math.max(0, ex.start + Math.round((x - ex.start) / ex.inc) * ex.inc);
  const doneSets = e => (e?.sets || []).filter(s => s && s.r > 0);

  /* Dernière séance exploitable d'un exercice avant la semaine w (hors semaines allégées si demandé). */
  function lastLog(exId, w, skipDeload) {
    for (let i = w - 1; i >= 1; i--) {
      if (skipDeload && isDeload(i)) continue;
      for (const k of Object.keys(SESSIONS)) {
        const e = S.logs[`${i}-${k}`]?.ex?.[exId];
        if (doneSets(e).length) return e;
      }
    }
    return null;
  }

  /* Double progression : même charge jusqu'au haut de la fourchette sur toutes les séries, puis palier supérieur. */
  function targetLoad(exId, w, role) {
    const ex = EX[exId], rx = prescription(w, role), h = lastLog(exId, w, true);
    let base;
    if (!h) {
      const p1 = RULES[1][role];
      base = rx.hi === p1.hi || ex.start === 0 ? ex.start : snap(ex, ex.start * (1 + (p1.hi + 1) / 30) / (1 + (rx.hi + 1) / 30));
    } else {
      const sets = doneSets(h), W = Math.max(...sets.map(s => s.w || 0)), top = sets.filter(s => (s.w || 0) === W);
      if (h.lo === rx.lo && h.hi === rx.hi) {
        if (sets.length >= h.n && sets.every(s => (s.w || 0) >= W && s.r >= rx.hi)) base = W + ex.inc;
        else if (top.every(s => s.r < rx.lo)) base = Math.max(0, W - ex.inc);
        else base = W;
      } else if (W === 0) base = 0;
      else {
        const e1 = Math.max(...sets.map(s => (s.w || 0) * (1 + s.r / 30)));
        base = snap(ex, e1 / (1 + (rx.hi + 1) / 30));
      }
    }
    return rx.deload ? snap(ex, base * 0.9) : base;
  }

  /* ---------- Formats ---------- */
  const mmss = sec => { sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
  function parseTime(t) {
    const p = String(t).trim().replace(/[h'’m]/gi, ':').replace(/[s"]/gi, '').split(':').filter(x => x !== '').map(Number);
    if (!p.length || p.some(isNaN)) return 0;
    return p.reduce((a, v) => a * 60 + v, 0);
  }
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
  function loadText(ex, kg) {
    if (ex.bw) return kg > 0 ? `+ ${nf.format(kg)} kg de lest` : 'poids du corps';
    return `${nf.format(kg)} kg${ex.hand ? ' par haltère' : ''}`;
  }
  function paces() {
    const ref = S.ref10k / 10;
    return { vma: ref - 25, p800: ref - 15, seuil: ref + 10, cible: S.target10k / 10, easyLo: ref + 55, easyHi: ref + 75 };
  }
  function runInfo(w, k) {
    const p = paces();
    if (k === 'Q') {
      const q = RUN_Q[w], km = 2.7 + q.reps * q.dist / 1000 + q.reps * q.rec / 390 + 1.8;
      return { name: q.title, sub: `${q.reps} × ${nf0.format(q.dist)} m · environ ${nf0.format(km)} km`, q, km };
    }
    if (w === 12) return { name: 'Test 10 km', sub: `Objectif ${mmss(S.target10k)}`, km: 10, test: true };
    return { name: 'Footing', sub: `${RUN_E[w]} km à ${mmss(p.easyLo)}–${mmss(p.easyHi)}/km`, km: RUN_E[w] };
  }

  /* ---------- Carte des muscles ---------- */
  const el2 = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><ellipse cx="${100 - cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const BODY = `<g class="b"><circle cx="50" cy="13" r="9"/><rect x="45.5" y="20" width="9" height="9" rx="3"/>
    <path d="M29 33 Q50 25 71 33 L68 72 Q66 92 65 104 L35 104 Q34 92 32 72 Z"/>
    ${el2(24, 51, 6.5, 17)}${el2(19, 83, 5, 15)}${el2(17, 101, 4, 4.5)}${el2(40, 130, 10.5, 30)}${el2(39, 180, 7, 24)}${el2(38, 208, 6.5, 4)}</g>`;
  const MM = {
    front: {
      traps: el2(40, 29.5, 6, 2.6), delts: el2(27, 37, 6, 7.5), pecs: el2(41, 45, 9, 7.5), biceps: el2(24, 55, 4.6, 10.5),
      forearms: el2(19, 81, 4, 12), abs: '<rect x="43" y="55" width="14" height="36" rx="5"/>', obliques: el2(36.5, 74, 3.4, 13),
      quads: el2(40, 130, 8.5, 25), calves: el2(39, 178, 5, 17),
    },
    back: {
      traps: '<path d="M50 23 L65 33 L50 60 L35 33 Z"/>', reardelts: el2(27, 37, 6, 7.5), lats: el2(39.5, 64, 7.5, 15),
      lowerback: '<rect x="44" y="78" width="12" height="18" rx="4"/>', triceps: el2(24, 55, 4.6, 10.5), forearms: el2(19, 81, 4, 12),
      glutes: el2(41.5, 108, 8.8, 9), hams: el2(40, 138, 8.5, 20), calves: el2(39, 176, 6, 16),
    },
  };
  function muscleMap(ex) {
    const side = s => `<svg viewBox="8 0 84 216" role="img" aria-label="${s === 'front' ? 'Vue de face' : 'Vue de dos'}">${BODY}${
      Object.entries(MM[s]).map(([m, sh]) => `<g class="${ex.p.includes(m) ? 'p' : ex.s.includes(m) ? 's' : 'm'}">${sh}</g>`).join('')}</svg>`;
    return `<div><div class="mm">${side('front')}${side('back')}</div>
      <div class="mm-legend"><span><i></i>Principal</span><span><i class="sec"></i>Secondaire</span></div></div>`;
  }

  /* ---------- Éléments communs ---------- */
  function statusBadge(w, k, day) {
    if (isDone(w, k)) return '<span class="badge ok">Fait</span>';
    const d = dateOf(w, day), t = today();
    if (+d === +t) return '<span class="badge">Aujourd’hui</span>';
    if (d < t) return '<span class="badge warn">À rattraper</span>';
    return CHEV;
  }
  function weekList(w) {
    return `<div class="week">${WEEK_ORDER.map(([k, day]) => {
      const run = isRun(k), info = run ? runInfo(w, k) : null, s = SESSIONS[k];
      const href = run ? `#/course/${w}/${k}` : `#/seance/${w}/${k}`;
      return `<a href="${href}"><span class="day">${dayFmt.format(dateOf(w, day))}</span>
        <span class="what"><b>${run ? 'Course · ' + info.name : s.name}</b><span>${run ? info.sub : `${s.sub} · ${s.ex.length} exercices`}</span></span>
        ${statusBadge(w, k, day)}</a>`;
    }).join('')}</div>`;
  }
  const weekRange = w => `du ${shortFmt.format(dateOf(w, 0))} au ${shortFmt.format(dateOf(w, 6))}`;
  const weekTag = w => w === 12 ? '<span class="badge warn">Semaine de test</span>' : isDeload(w) ? '<span class="badge neutral">Semaine allégée</span>' : '';
  const countDone = w => WEEK_ORDER.filter(([k]) => isDone(w, k)).length;
  function totalDone() { let n = 0; for (let w = 1; w <= TOTAL_WEEKS; w++) n += countDone(w); return n; }

  /* ---------- Vue : Aujourd'hui ---------- */
  function viewToday() {
    const w = currentWeek(), ph = phaseOf(w), P = PHASES[ph], t = today(), start = parse(S.start);
    const next = WEEK_ORDER.find(([k]) => !isDone(w, k));
    const total = totalDone(), all = TOTAL_WEEKS * WEEK_ORDER.length;
    let banner = '';
    if (t < start) banner = `<div class="banner info"><span>Le programme démarre le ${dayFmt.format(start)}.</span><a class="btn sm" href="#/reglages">Changer la date</a></div>`;
    else if (t > dateOf(TOTAL_WEEKS, 6)) banner = `<div class="banner info"><span>Les 12 semaines sont terminées. Mets à jour tes repères et relance un cycle.</span><a class="btn sm" href="#/reglages">Réglages</a></div>`;
    let nextHtml;
    if (next) {
      const [k, day] = next, run = isRun(k), info = run ? runInfo(w, k) : null, s = SESSIONS[k];
      nextHtml = `<div class="eyebrow">Prochaine séance · ${dayFmt.format(dateOf(w, day))}</div>
        <h2 style="margin:6px 0 4px">${run ? 'Course · ' + info.name : s.name + ' · ' + s.sub}</h2>
        <p class="muted">${run ? info.sub : s.ex.slice(0, 3).map(([id]) => EX[id].n).join(', ') + '…'}</p>
        <a class="btn primary lg" href="${run ? `#/course/${w}/${k}` : `#/seance/${w}/${k}`}">Ouvrir la séance</a>`;
    } else {
      nextHtml = `<div class="eyebrow">Semaine ${w}</div><h2 style="margin:6px 0 4px">Semaine complète</h2>
        <p class="muted">Les six séances sont faites. Récupère, la suite arrive lundi.</p><a class="btn" href="#/programme">Voir la suite</a>`;
    }
    view.innerHTML = `<div class="page-head"><div><h1>Aujourd’hui</h1><p>${dayFmt.format(t)}</p></div></div><main>${banner}
      <section class="card grid grid-hero">
        <div><div class="eyebrow">Phase ${ph} · ${P.name}</div>
          <div class="big">Semaine ${w}</div>
          <div class="muted">sur ${TOTAL_WEEKS} · ${weekRange(w)} ${weekTag(w)}</div>
          <div class="bar" aria-hidden="true"><span style="width:${Math.round(total / all * 100)}%"></span></div>
          <div class="small muted num">${total} séance${total > 1 ? 's' : ''} faite${total > 1 ? 's' : ''} sur ${all}</div></div>
        <div>${nextHtml}</div>
      </section>
      <section class="card"><div class="card-head"><h2>Cette semaine</h2><span class="badge neutral num">${countDone(w)} / ${WEEK_ORDER.length}</span></div>${weekList(w)}</section>
      <div class="grid grid-2">
        <section class="card"><h2>Objectif de la phase</h2><p>${P.goal}</p><p class="muted">${P.effort}</p></section>
        <section class="card"><h2>La règle de progression</h2>
          <p>Garde la même charge tant que tu n’atteins pas le haut de la fourchette sur <b>toutes</b> les séries. Dès que c’est fait, l’objectif de la séance suivante monte d’un palier.</p>
          <p class="muted">L’application calcule la charge à partir de ce que tu saisis : note chaque série.</p></section>
      </div></main>`;
  }

  /* ---------- Vue : Programme ---------- */
  let phaseTab = 0;
  function viewProgramme() {
    const ph = phaseTab || phaseOf(currentWeek()), P = PHASES[ph], R = RULES[ph];
    const weeks = [1, 2, 3, 4].map(i => (ph - 1) * 4 + i);
    view.innerHTML = `<div class="page-head"><div><h1>Programme</h1><p>12 semaines, 3 phases · 4 séances de musculation et 2 de course par semaine</p></div>
      <div class="seg" role="group" aria-label="Phase">${[1, 2, 3].map(i =>
        `<button type="button" data-phase="${i}" aria-pressed="${i === ph}">Phase ${i}</button>`).join('')}</div></div><main>
      <section class="card"><div class="eyebrow">${P.weeks}</div><h2 style="margin-top:4px">Phase ${ph} · ${P.name}</h2>
        <p>${P.goal}</p><p class="muted">${P.effort} En course : ${P.run}</p>
        <div class="stats">${['main', 'comp', 'acc'].map(r => `<div class="stat"><div class="label">${ROLE_LABEL[r]}</div>
          <div class="value">${R[r].sets} × ${R[r].lo}-${R[r].hi}</div><div class="sub">repos ${mmss(R[r].rest)}</div></div>`).join('')}</div>
        <p class="note">La quatrième semaine de chaque phase est allégée : 2 séries par exercice à 90 % de la charge, pour récupérer avant la suite.</p>
      </section>
      <div class="grid grid-2">${weeks.map(w => `<section class="card"><div class="card-head"><h2>Semaine ${w}</h2>
        <span class="row">${weekTag(w)}<span class="small muted">${weekRange(w)}</span></span></div>${weekList(w)}</section>`).join('')}</div></main>`;
  }

  /* ---------- Vue : Séance de musculation ---------- */
  function viewSession(w, k) {
    const s = SESSIONS[k];
    if (!s || !(w >= 1 && w <= TOTAL_WEEKS)) return viewToday();
    const key = `${w}-${k}`, log = S.logs[key];
    const cards = s.ex.map(([id, role], i) => {
      const ex = EX[id], rx = prescription(w, role), kg = targetLoad(id, w, role), prev = lastLog(id, w, false), cur = log?.ex?.[id];
      const prevTxt = prev ? `Dernière fois : ${doneSets(prev).map(x => `${ex.bw && !x.w ? '' : nf.format(x.w || 0) + ' kg × '}${x.r}`).join(' · ')}` : 'Première séance sur cet exercice.';
      const rows = Array.from({ length: rx.sets }, (_, n) => {
        const v = cur?.sets?.[n] || {};
        const lab = rx.test && n === 1 ? 'Max' : 'Série ' + (n + 1);
        return `<div class="set" data-set="${n}"><span class="lab">${lab}</span>
          <label><span class="sr-only">Charge série ${n + 1}</span><input class="num" inputmode="decimal" data-f="w" value="${esc(v.w != null ? nf.format(v.w) : nf.format(kg))}" aria-label="Charge en kg, série ${n + 1}"> kg</label>
          <label><input class="num" inputmode="numeric" data-f="r" value="${esc(v.r || '')}" placeholder="${rx.test && n === 1 ? 'max' : rx.lo + '-' + rx.hi}" aria-label="Répétitions, série ${n + 1}"> reps</label>
          <button type="button" class="btn ok" data-ok aria-pressed="${!!v.r}" aria-label="Valider la série ${n + 1} et lancer le repos">${CHECK}</button></div>`;
      }).join('');
      return `<section class="card ex" data-ex="${id}" data-role="${role}">
        <div class="ex-top">
          <div class="anim"><img src="img/ex/${ex.img}_0.jpg" alt="${esc(ex.n)}, position de départ" loading="lazy"><img src="img/ex/${ex.img}_1.jpg" alt="" loading="lazy"></div>
          <div class="ex-info"><div class="eyebrow">Exercice ${i + 1} · ${ROLE_LABEL[role]}</div><h2>${ex.n}</h2>
            <p class="target"><b>${rx.sets} × ${rx.lo}-${rx.hi}</b> à <b>${loadText(ex, kg)}</b> · repos ${mmss(rx.rest)}</p>
            ${rx.test ? '<p class="small"><b>Test :</b> deuxième série au maximum de répétitions propres.</p>' : ''}
            <p class="muted small">${ex.cue}</p><p class="muted small num">${prevTxt}</p>
            <div class="tags">${ex.p.map(m => `<span class="badge">${MUSCLES[m]}</span>`).join('')}${ex.s.map(m => `<span class="badge neutral">${MUSCLES[m]}</span>`).join('')}
              ${ex.est && !prev ? '<span class="badge warn">Charge estimée, à ajuster</span>' : ''}</div></div>
          ${muscleMap(ex)}
        </div>
        <div class="sets">${rows}</div></section>`;
    }).join('');
    view.innerHTML = `<a class="back" href="#/">${BACK}Retour</a>
      <div class="page-head"><div><h1>${s.name} · ${s.sub}</h1><p>Semaine ${w} · Phase ${phaseOf(w)} ${PHASES[phaseOf(w)].name} · ${dayFmt.format(dateOf(w, s.day))}</p></div>
        <span class="row">${weekTag(w)}${log?.done ? '<span class="badge ok">Fait</span>' : ''}</span></div>
      <main data-session="${key}">${cards}
        <div class="toolbar"><span class="spacer"></span>
          ${log?.done ? '<button type="button" class="btn" data-undone>Marquer comme non faite</button>' : ''}
          <button type="button" class="btn primary lg" data-finish>${log?.done ? 'Mettre à jour la séance' : 'Terminer la séance'}</button></div></main>`;
  }

  function collectSession(main) {
    const key = main.dataset.session, [w] = key.split('-').map(Number);
    const log = S.logs[key] || (S.logs[key] = { ex: {} });
    main.querySelectorAll('.ex').forEach(card => {
      const id = card.dataset.ex, rx = prescription(w, card.dataset.role);
      const sets = [...card.querySelectorAll('.set')].map(r => ({ w: num(r.querySelector('[data-f=w]').value), r: Math.round(num(r.querySelector('[data-f=r]').value)) }));
      log.ex[id] = { lo: rx.lo, hi: rx.hi, n: rx.sets, sets };
    });
    save();
    return log;
  }

  /* ---------- Vue : Séance de course ---------- */
  function viewRun(w, k) {
    if (!isRun(k) || !(w >= 1 && w <= TOTAL_WEEKS)) return viewToday();
    const info = runInfo(w, k), p = paces(), key = `${w}-${k}`, log = S.runs[key] || {};
    const day = WEEK_ORDER.find(x => x[0] === k)[1];
    const block = (n, cls, title, sub, pace) => `<div class="block ${cls}"><span class="n">${n}</span><div><b>${title}</b><span>${sub}</span></div><div class="pace">${pace}</div></div>`;
    const easy = `${mmss(p.easyLo)}–${mmss(p.easyHi)}/km`;
    let blocks, watch;
    if (k === 'Q') {
      const q = info.q, pc = p[q.pace];
      blocks = block(1, '', 'Échauffement', '15 minutes de footing, puis 3 accélérations de 80 m', easy)
        + block(2, 'work', `${q.reps} × ${nf0.format(q.dist)} m`, `${PACE_LABEL[q.pace]} · ${mmss(pc * q.dist / 1000)} par répétition · récupération ${mmss(q.rec)} en trottinant`, mmss(pc) + '/km')
        + block(3, '', 'Retour au calme', '10 minutes de footing très facile', easy);
      watch = `<li>Échauffement : objectif Temps, 15 minutes.</li><li>Travail : objectif Distance, ${nf0.format(q.dist)} m, alerte d’allure ${mmss(pc)}/km.</li>
        <li>Récupération : objectif Temps, ${mmss(q.rec)}.</li><li>Répéter le bloc travail + récupération ${q.reps} fois.</li><li>Retour au calme : objectif Temps, 10 minutes.</li>`;
    } else if (info.test) {
      blocks = block(1, '', 'Échauffement', '15 minutes de footing, puis 4 accélérations de 80 m', easy)
        + block(2, 'work', '10 km chronométrés', `Pars à l’allure visée, accélère sur les 2 derniers kilomètres si tu peux · objectif ${mmss(S.target10k)}`, mmss(p.cible) + '/km')
        + block(3, '', 'Retour au calme', '5 à 10 minutes en marchant ou en trottinant', '—');
      watch = `<li>Échauffement : objectif Temps, 15 minutes.</li><li>Travail : objectif Distance, 10 km, alerte d’allure ${mmss(p.cible)}/km.</li>`;
    } else {
      blocks = block(1, 'work', `Footing de ${info.km} km`, 'Aisance respiratoire : tu dois pouvoir parler en phrases complètes. Termine par 4 lignes droites de 20 secondes.', easy);
      watch = `<li>Un seul bloc Travail : objectif Distance, ${info.km} km, alerte d’allure entre ${mmss(p.easyLo)} et ${mmss(p.easyHi)}/km.</li>`;
    }
    view.innerHTML = `<a class="back" href="#/">${BACK}Retour</a>
      <div class="page-head"><div><h1>Course · ${info.name}</h1><p>Semaine ${w} · Phase ${phaseOf(w)} ${PHASES[phaseOf(w)].name} · ${dayFmt.format(dateOf(w, day))}</p></div>
        <span class="row">${weekTag(w)}${log.done ? '<span class="badge ok">Fait</span>' : ''}</span></div>
      <main data-run="${key}">
        <section class="card"><div class="card-head"><h2>Déroulé</h2><span class="badge neutral num">environ ${nf0.format(info.km)} km</span></div><div class="blocks">${blocks}</div>
          <p class="note">Allures calculées depuis ton temps de référence sur 10 km (${mmss(S.ref10k)}) et ton objectif (${mmss(S.target10k)}). Modifiables dans les réglages.</p></section>
        <div class="grid grid-2">
          <section class="card"><h2>Sur l’Apple Watch</h2>
            <p class="muted">Exercice → Course en extérieur → « ⋯ » → Créer un entraînement → Personnalisé, puis :</p><ol class="steps">${watch}</ol></section>
          <section class="card"><h2>Ma séance</h2>
            <div class="form">
              <div class="field"><label for="r-dist">Distance (km)</label><input id="r-dist" class="num" inputmode="decimal" value="${esc(log.dist ? nf.format(log.dist) : '')}" placeholder="${nf0.format(info.km)}"></div>
              <div class="field"><label for="r-time">Durée (mm:ss)</label><input id="r-time" class="num" inputmode="numeric" value="${esc(log.time ? mmss(log.time) : '')}" placeholder="52:30"></div>
              <div class="field"><label for="r-feel">Sensations</label><select id="r-feel">${['Facile', 'Correct', 'Difficile'].map(f => `<option${log.feel === f ? ' selected' : ''}>${f}</option>`).join('')}</select></div>
            </div>
            <p class="note num" id="r-pace">${log.dist && log.time ? 'Allure moyenne : ' + mmss(log.time / log.dist) + '/km' : 'Saisis la distance et la durée relevées sur ta montre.'}</p>
            <div class="toolbar" style="margin:16px 0 0"><span class="spacer"></span>
              ${log.done ? '<button type="button" class="btn" data-run-undone>Marquer comme non faite</button>' : ''}
              <button type="button" class="btn primary" data-run-save>Enregistrer la séance</button></div></section>
        </div></main>`;
  }

  /* ---------- Vue : Progrès ---------- */
  let charts = [], chartEx = 'bench';
  function exSeries(id) {
    const pts = [];
    for (let w = 1; w <= TOTAL_WEEKS; w++) for (const k of Object.keys(SESSIONS)) {
      const sets = doneSets(S.logs[`${w}-${k}`]?.ex?.[id]);
      if (sets.length) pts.push({ w, top: Math.max(...sets.map(s => s.w || 0)), e1: Math.max(...sets.map(s => (s.w || 0) * (1 + s.r / 30))), reps: Math.max(...sets.map(s => s.r)) });
    }
    return pts;
  }
  function muscleSets(w) {
    const plan = {}, done = {};
    for (const [k, s] of Object.entries(SESSIONS)) for (const [id, role] of s.ex) {
      const ex = EX[id], n = prescription(w, role).sets, d = doneSets(S.logs[`${w}-${k}`]?.ex?.[id]).length;
      ex.p.forEach(m => { plan[m] = (plan[m] || 0) + n; done[m] = (done[m] || 0) + d; });
      ex.s.forEach(m => { plan[m] = (plan[m] || 0) + n / 2; done[m] = (done[m] || 0) + d / 2; });
    }
    return { plan, done };
  }
  function viewProgress() {
    const w = currentWeek(), total = totalDone(), all = TOTAL_WEEKS * WEEK_ORDER.length;
    let tonnage = 0;
    for (const k of Object.keys(SESSIONS)) for (const [id, e] of Object.entries(S.logs[`${w}-${k}`]?.ex || {}))
      doneSets(e).forEach(s => { tonnage += (s.w || 0) * s.r * (EX[id]?.hand ? 2 : 1); });
    const runs = Object.entries(S.runs).filter(([, r]) => r.dist && r.time).map(([key, r]) => ({ key, ...r })).sort((a, b) => a.date < b.date ? -1 : 1);
    const kmWeek = ['Q', 'E'].reduce((a, k) => a + (S.runs[`${w}-${k}`]?.dist || 0), 0);
    const last = runs[runs.length - 1];
    const b = exSeries('bench'), sq = exSeries('squat');
    const delta = pts => { if (pts.length < 2) return '<span class="muted">n/d</span>'; const d = pts[pts.length - 1].e1 - pts[0].e1;
      return Math.abs(d) < 0.05 ? '<span class="muted">stable</span>' : `<span class="delta ${d > 0 ? 'pos' : 'neg'}">${d > 0 ? '+' : '−'}${nf.format(Math.abs(d))} kg</span>`; };
    view.innerHTML = `<div class="page-head"><div><h1>Progrès</h1><p>Semaine ${w} sur ${TOTAL_WEEKS} · Phase ${phaseOf(w)} ${PHASES[phaseOf(w)].name}</p></div></div><main>
      <div class="grid grid-4" style="margin-bottom:20px">
        <section class="card"><div class="kpi"><span class="label">Séances réalisées</span><span class="value">${total}</span><span class="sub">sur ${all} · <b>${nf0.format(total / all * 100)} %</b></span></div></section>
        <section class="card"><div class="kpi"><span class="label">Charge soulevée cette semaine</span><span class="value">${tonnage ? nf0.format(tonnage) + ' kg' : '—'}</span><span class="sub">${countDone(w)} séances sur ${WEEK_ORDER.length} cette semaine</span></div></section>
        <section class="card"><div class="kpi"><span class="label">Force estimée, développé couché</span><span class="value">${b.length ? nf.format(b[b.length - 1].e1) + ' kg' : '—'}</span><span class="sub">depuis le début : ${delta(b)} · squat : ${delta(sq)}</span></div></section>
        <section class="card"><div class="kpi"><span class="label">Course cette semaine</span><span class="value">${kmWeek ? nf.format(kmWeek) + ' km' : '—'}</span><span class="sub">${last ? 'dernière allure : <b>' + mmss(last.time / last.dist) + '/km</b>' : 'aucune sortie enregistrée'}</span></div></section>
      </div>
      <div class="grid grid-2" style="margin-bottom:20px">
        <section class="card"><div class="card-head"><h2>Progression par exercice</h2>
          <select id="chart-ex" aria-label="Exercice">${Object.entries(EX).map(([id, e]) => `<option value="${id}"${id === chartEx ? ' selected' : ''}>${e.n}</option>`).join('')}</select></div>
          <div class="chart sm" id="c-ex-wrap"><canvas id="c-ex"></canvas></div><p class="note" id="c-ex-note"></p></section>
        <section class="card"><div class="card-head"><h2>Séries par muscle, semaine ${w}</h2></div>
          <div class="chart sm"><canvas id="c-mus"></canvas></div><p class="note">Un muscle secondaire compte pour une demi-série.</p></section>
      </div>
      <section class="card"><div class="card-head"><h2>Course à pied</h2></div>
        ${runs.length ? `<div class="chart sm"><canvas id="c-run"></canvas></div>
        <div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>Date</th><th>Séance</th><th class="r">Distance</th><th class="r">Durée</th><th class="r">Allure</th><th>Sensations</th></tr></thead><tbody>
        ${runs.slice().reverse().map(r => { const [rw, rk] = r.key.split('-'); return `<tr><td>${shortFmt.format(parse(r.date))}</td><td>S${rw} · ${runInfo(+rw, rk).name}</td>
          <td class="r">${nf.format(r.dist)} km</td><td class="r">${mmss(r.time)}</td><td class="r">${mmss(r.time / r.dist)}/km</td><td>${esc(r.feel || '—')}</td></tr>`; }).join('')}
        <tr class="total"><td>Total</td><td></td><td class="r">${nf.format(runs.reduce((a, r) => a + r.dist, 0))} km</td><td class="r">${mmss(runs.reduce((a, r) => a + r.time, 0))}</td><td></td><td></td></tr></tbody></table></div>`
        : '<div class="empty"><h2>Aucune sortie enregistrée</h2><p>Saisis distance et durée après chaque course pour suivre ton allure.</p><a class="btn primary" href="#/programme">Voir les séances</a></div>'}
      </section></main>`;
    drawCharts(w, runs);
  }
  function drawCharts(w, runs) {
    charts.forEach(c => c.destroy()); charts = [];
    if (!window.Chart) return;
    const C = Sable.colors();
    const pts = exSeries(chartEx), ex = EX[chartEx], note = document.getElementById('c-ex-note');
    if (pts.length) {
      const ds = ex.bw && pts.every(p => !p.top)
        ? [{ label: 'Répétitions max', data: pts.map(p => p.reps), borderColor: C.accent, backgroundColor: C.accentSoft, fill: 'start', pointRadius: 3 }]
        : [{ label: 'Charge de travail (kg)', data: pts.map(p => p.top), borderColor: C.accent, backgroundColor: C.accentSoft, fill: 'start', pointRadius: 3 },
           { label: 'Force estimée sur 1 répétition (kg)', data: pts.map(p => Math.round(p.e1 * 10) / 10), borderColor: C.label, borderDash: [5, 4], pointRadius: 0 }];
      charts.push(new Chart(document.getElementById('c-ex'), { type: 'line', data: { labels: pts.map(p => 'S' + p.w), datasets: ds }, options: { scales: { y: { beginAtZero: false } } } }));
      note.textContent = 'Force estimée : formule d’Epley à partir de ta meilleure série.';
    } else {
      document.getElementById('c-ex-wrap').hidden = true;
      note.textContent = 'Pas encore de série enregistrée sur cet exercice.';
    }
    const { plan, done } = muscleSets(w), keys = Object.keys(plan).sort((a, b) => plan[b] - plan[a]);
    charts.push(new Chart(document.getElementById('c-mus'), { type: 'bar',
      data: { labels: keys.map(k => MUSCLES[k]), datasets: [
        { label: 'Réalisées', data: keys.map(k => done[k]), backgroundColor: C.series[0] },
        { label: 'Prévues', data: keys.map(k => plan[k]), backgroundColor: C.series[1] }] },
      options: { scales: { x: { grid: { display: false }, ticks: { maxRotation: 60, minRotation: 40 } }, y: { beginAtZero: true } } } }));
    const cr = document.getElementById('c-run');
    if (cr) charts.push(new Chart(cr, { type: 'line',
      data: { labels: runs.map(r => shortFmt.format(parse(r.date))), datasets: [
        { label: 'Allure moyenne', data: runs.map(r => Math.round(r.time / r.dist)), borderColor: C.accent, backgroundColor: C.accentSoft, fill: 'start', pointRadius: 3 },
        { label: 'Allure 10 km visée', data: runs.map(() => S.target10k / 10), borderColor: C.label, borderDash: [5, 4], pointRadius: 0 }] },
      options: { scales: { y: { reverse: true, ticks: { callback: v => mmss(v) } } },
        plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label} : ${mmss(c.parsed.y)}/km` } } } } }));
  }

  /* ---------- Vue : Réglages ---------- */
  function viewSettings() {
    view.innerHTML = `<div class="page-head"><div><h1>Réglages</h1><p>Repères du programme et sauvegarde de tes données</p></div></div><main>
      <div class="grid grid-2" style="margin-bottom:20px">
        <section class="card"><h2>Programme</h2><div class="form">
          <div class="field"><label for="s-start">Premier jour (semaine 1)</label><input id="s-start" type="date" value="${esc(S.start)}"></div>
          <div class="field"><label for="s-ref">Temps actuel sur 10 km</label><input id="s-ref" class="num" inputmode="numeric" value="${mmss(S.ref10k)}"></div>
          <div class="field"><label for="s-target">Objectif sur 10 km</label><input id="s-target" class="num" inputmode="numeric" value="${mmss(S.target10k)}"></div></div>
          <p class="note">Le temps actuel fixe toutes les allures d’entraînement. Par défaut 46:00, estimé depuis ton marathon en 3 h 33 ; corrige-le si tu as un chrono récent.</p></section>
        <section class="card"><h2>Installer sur l’iPhone</h2><ol class="steps"><li>Ouvre l’adresse de l’application dans Safari.</li><li>Touche Partager, puis « Sur l’écran d’accueil ».</li><li>Lance Élan depuis l’icône : elle fonctionne aussi sans réseau.</li></ol>
          <p class="note">Les données restent sur l’appareil où tu les saisis. Utilise l’export ci-dessous pour les copier sur un autre.</p></section>
      </div>
      <section class="card"><h2>Mes données</h2><p class="muted">${Object.keys(S.logs).length} séances de musculation et ${Object.keys(S.runs).length} courses enregistrées sur cet appareil.</p>
        <div class="row"><button type="button" class="btn" id="s-export">Exporter un fichier</button>
          <label class="btn" for="s-import">Importer un fichier</label><input id="s-import" type="file" accept="application/json,.json" class="sr-only">
          <span class="spacer"></span><button type="button" class="btn danger" id="s-reset">Tout effacer</button></div></section></main>`;
  }

  /* ---------- Minuteur de repos ---------- */
  const rest = document.getElementById('rest'), restTime = document.getElementById('rest-time');
  let restEnd = 0, restInt = 0, audio = null;
  function beep() {
    try { const o = audio.createOscillator(), g = audio.createGain(); o.connect(g); g.connect(audio.destination); o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.6); o.start(); o.stop(audio.currentTime + 0.6); } catch { }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
  function stopRest() { clearInterval(restInt); rest.hidden = true; rest.classList.remove('done'); document.body.classList.remove('has-rest'); }
  function tick() {
    const left = Math.ceil((restEnd - Date.now()) / 1000);
    if (left > 0) { restTime.textContent = mmss(left); return; }
    restTime.textContent = '0:00';
    if (!rest.classList.contains('done')) { rest.classList.add('done'); beep(); Sable.toast('Repos terminé'); }
    if (left < -8) stopRest();
  }
  function startRest(sec) {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch { }
    restEnd = Date.now() + sec * 1000; rest.classList.remove('done'); rest.hidden = false; document.body.classList.add('has-rest');
    clearInterval(restInt); restInt = setInterval(tick, 250); tick();
  }
  document.getElementById('rest-plus').addEventListener('click', () => { restEnd = Math.max(restEnd, Date.now()) + 30000; rest.classList.remove('done'); tick(); });
  document.getElementById('rest-stop').addEventListener('click', stopRest);

  /* ---------- Confirmation ---------- */
  const modal = document.getElementById('confirm');
  let onYes = null;
  function confirmBox(title, text, yes) { document.getElementById('confirm-title').textContent = title; document.getElementById('confirm-text').textContent = text; onYes = yes; modal.hidden = false; document.getElementById('confirm-no').focus(); }
  document.getElementById('confirm-no').addEventListener('click', () => { modal.hidden = true; });
  document.getElementById('confirm-yes').addEventListener('click', () => { modal.hidden = true; if (onYes) onYes(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.hidden = true; });

  /* ---------- Événements ---------- */
  view.addEventListener('click', e => {
    const t = e.target, main = view.querySelector('main');
    const ph = t.closest('[data-phase]');
    if (ph) { phaseTab = +ph.dataset.phase; return viewProgramme(); }
    const ok = t.closest('[data-ok]');
    if (ok) {
      const row = ok.closest('.set'), card = ok.closest('.ex'), r = row.querySelector('[data-f=r]');
      const [w] = main.dataset.session.split('-').map(Number), rx = prescription(w, card.dataset.role);
      if (ok.getAttribute('aria-pressed') === 'true') { ok.setAttribute('aria-pressed', 'false'); r.value = ''; collectSession(main); return; }
      if (!num(r.value)) r.value = rx.hi;
      ok.setAttribute('aria-pressed', 'true'); collectSession(main); startRest(rx.rest); return;
    }
    if (t.closest('[data-finish]')) {
      const log = collectSession(main);
      if (!Object.values(log.ex).some(x => doneSets(x).length)) return Sable.toast('Saisis au moins une série avant de terminer');
      log.done = true; log.date = log.date || iso(today()); save(); stopRest(); Sable.toast('Séance enregistrée'); location.hash = '#/'; return;
    }
    if (t.closest('[data-undone]')) { S.logs[main.dataset.session].done = false; save(); return route(); }
    if (t.closest('[data-run-save]')) {
      const dist = num(document.getElementById('r-dist').value), time = parseTime(document.getElementById('r-time').value);
      if (!dist || !time) return Sable.toast('Indique la distance et la durée');
      const key = main.dataset.run, prev = S.runs[key] || {};
      S.runs[key] = { done: true, date: prev.date || iso(today()), dist, time, feel: document.getElementById('r-feel').value };
      if (key === '12-E' && Math.abs(dist - 10) <= 0.15) { S.ref10k = Math.round(time / dist * 10); Sable.toast('Test enregistré : ' + mmss(S.ref10k) + ' sur 10 km'); }
      else Sable.toast('Course enregistrée');
      save(); location.hash = '#/'; return;
    }
    if (t.closest('[data-run-undone]')) { delete S.runs[main.dataset.run]; save(); return route(); }
    if (t.closest('#s-export')) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }));
      a.download = `elan-${iso(today())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); return;
    }
    if (t.closest('#s-reset')) confirmBox('Tout effacer ?', 'Toutes les séances enregistrées sur cet appareil seront supprimées. Cette action est définitive.',
      () => { S = defaults(); save(); Sable.toast('Données effacées'); route(); });
  });
  view.addEventListener('input', e => {
    const main = view.querySelector('main');
    if (e.target.closest('.set')) {
      const row = e.target.closest('.set');
      if (e.target.dataset.f === 'r') row.querySelector('[data-ok]').setAttribute('aria-pressed', String(num(e.target.value) > 0));
      collectSession(main);
    }
    if (e.target.id === 'r-dist' || e.target.id === 'r-time') {
      const d = num(document.getElementById('r-dist').value), tm = parseTime(document.getElementById('r-time').value);
      document.getElementById('r-pace').textContent = d && tm ? 'Allure moyenne : ' + mmss(tm / d) + '/km' : 'Saisis la distance et la durée relevées sur ta montre.';
    }
  });
  view.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'chart-ex') { chartEx = e.target.value; return viewProgress(); }
    if (id === 's-start' && e.target.value) { S.start = e.target.value; save(); Sable.toast('Date de départ mise à jour'); }
    if (id === 's-ref' || id === 's-target') {
      const v = parseTime(e.target.value);
      if (v < 1500 || v > 5400) { Sable.toast('Temps attendu entre 25:00 et 90:00'); return route(); }
      S[id === 's-ref' ? 'ref10k' : 'target10k'] = v; save(); Sable.toast('Allures recalculées'); route();
    }
    if (id === 's-import' && e.target.files[0]) {
      const file = e.target.files[0];
      file.text().then(txt => {
        const d = JSON.parse(txt);
        if (!d || typeof d.logs !== 'object' || typeof d.runs !== 'object') throw 0;
        confirmBox('Remplacer les données ?', 'Les données de cet appareil seront remplacées par celles du fichier.',
          () => { S = Object.assign(defaults(), d); save(); Sable.toast('Données importées'); route(); });
      }).catch(() => Sable.toast('Fichier non reconnu'));
    }
  });

  /* ---------- Routage ---------- */
  function route() {
    const [, name, a, b] = (location.hash || '#/').split('/');
    const nav = { '': 'today', programme: 'programme', seance: 'programme', course: 'programme', progres: 'progres', reglages: 'reglages' }[name || ''] || 'today';
    document.querySelectorAll('.topbar nav a').forEach(l => l.dataset.nav === nav ? l.setAttribute('aria-current', 'page') : l.removeAttribute('aria-current'));
    charts.forEach(c => c.destroy()); charts = [];
    if (name === 'programme') viewProgramme();
    else if (name === 'seance') viewSession(+a, b);
    else if (name === 'course') viewRun(+a, b);
    else if (name === 'progres') viewProgress();
    else if (name === 'reglages') viewSettings();
    else viewToday();
  }
  let lastHash = null;
  window.addEventListener('hashchange', () => { if (location.hash !== lastHash) { lastHash = location.hash; route(); window.scrollTo(0, 0); } });
  document.addEventListener('sable:theme', () => { if ((location.hash || '').startsWith('#/progres')) viewProgress(); });
  route();
})();

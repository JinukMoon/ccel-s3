/* Publications page: full list grouped by year (search + filters), Selected view, Covers view. */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc, rich, plain, asset, byNo } = S;
  const $ = sel => document.querySelector(sel);

  S.renderChrome('publications');
  S.headerArt();

  const pubs = D.publications.slice().sort((a, b) => (b.year || 0) - (a.year || 0) || b.no - a.no);
  const counts = D.publication_counts || {};
  const published = pubs.filter(p => p.status === 'published').length;
  const years = pubs.map(p => p.year).filter(Boolean);
  $('[data-p=sub]').innerHTML = `<strong>${published}</strong> published papers, ${Math.min(...years)}&ndash;${Math.max(...years)}` +
    (pubs.length > published ? `, and <strong>${pubs.length - published}</strong> submitted, in revision or in press.` : '.');

  /* ---- All: filters ---- */
  const q = $('#q'), fy = $('#f-year'), fs = $('#f-status'), fa = $('#f-area'), fl = $('#f-led');
  const yearList = [...new Set(Object.keys(counts).map(Number).concat(years))].sort((a, b) => b - a);
  fy.innerHTML = '<option value="">All years</option>' + yearList.map(y => `<option value="${y}">${y}</option>`).join('');
  const ORDER = ['published', 'accepted', 'in press', 'in revision', 'submitted'];
  const statuses = [...new Set(pubs.map(p => p.status).filter(Boolean))].sort((a, b) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99);
  fs.innerHTML = '<option value="">All statuses</option>' + statuses.map(s => `<option value="${esc(s)}">${esc(s === 'published' ? 'Published' : S.statusLabel(s))}</option>`).join('');
  fa.innerHTML = '<option value="">All areas</option>' + S.areas.map(a => `<option value="${esc(a.numeral)}">${esc(a.numeral)} &middot; ${esc(plain(a.title))}</option>`).join('') +
    (pubs.some(p => !p.area) ? '<option value="none">Not assigned</option>' : '');

  /* ---- All: list (rendered once, filtered by toggling `hidden`) ---- */
  const row = p => {
    const href = S.paperHref(p), cov = S.coverOf(p, false), a = S.areaOf(p.area);
    let meta = S.metaHTML(p, !!cov);
    if (cov) meta = meta.replace(/<\/p>$/, `<a href="${esc(asset(cov.image))}">View cover</a></p>`);
    return `<li class="pub"><span class="no" aria-label="Publication number">${esc(p.no)}</span><div>
      <h3 class="paper-title">${href ? `<a href="${esc(href)}">${rich(p.title)}</a>` : rich(p.title)}</h3>
      <p class="paper-authors">${S.authorsHTML(p)}</p>
      <p class="paper-src">${esc(S.source(p))}${S.statusBadge(p)}${a ? ` <span class="badge" title="${esc(plain(a.title))}">Area ${esc(a.numeral)}</span>` : ''}</p>
      ${meta}</div></li>`;
  };
  const byYear = new Map();
  pubs.forEach((p, i) => { const y = p.year || 0; if (!byYear.has(y)) byYear.set(y, []); byYear.get(y).push(i); });
  $('[data-p=list]').innerHTML = [...byYear.keys()].map(y => {
    const total = counts[y] != null ? counts[y] : byYear.get(y).length;
    return `<section class="year" data-year="${y}" aria-labelledby="y-${y}"><div class="year-head"><h2 id="y-${y}">${y || 'Undated'}</h2><span data-c data-total="${total}">${total} papers</span></div>
      <ol class="plist">${byYear.get(y).map(i => row(pubs[i])).join('')}</ol></section>`;
  }).join('');
  const rows = [...document.querySelectorAll('.pub')];
  const yearEls = [...document.querySelectorAll('.year')];
  const yearOf = rows.map((_, i) => pubs[i].year || 0);
  const hay = pubs.map(p => (plain(p.title) + ' ' + plain(p.authors) + ' ' + (p.journal || '') + ' ' + (p.citation_tail || '')).toLowerCase());

  function filter() {
    const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const y = fy.value, st = fs.value, ar = fa.value, led = fl.checked;
    const any = terms.length || y || st || ar || led;
    const vis = new Map();
    let n = 0;
    rows.forEach((li, i) => {
      const p = pubs[i];
      const on = (!y || String(p.year) === y) && (!st || p.status === st) &&
        (!ar || (ar === 'none' ? !p.area : p.area === ar)) && (!led || p.lab_led) && terms.every(t => hay[i].includes(t));
      li.hidden = !on;
      if (on) { n++; vis.set(yearOf[i], (vis.get(yearOf[i]) || 0) + 1); }
    });
    yearEls.forEach(el => {
      const v = vis.get(+el.dataset.year) || 0, c = el.querySelector('[data-c]');
      el.hidden = !v;
      c.textContent = any ? `${v} of ${c.dataset.total} papers` : `${c.dataset.total} papers`;
    });
    $('[data-p=count]').textContent = any ? `Showing ${n} of ${pubs.length}` : `${pubs.length} entries, newest first`;
    $('[data-p=reset]').hidden = !any;
    $('[data-p=empty]').hidden = n > 0;
    const sp = new URLSearchParams();
    if (q.value.trim()) sp.set('q', q.value.trim());
    if (y) sp.set('year', y); if (st) sp.set('status', st); if (ar) sp.set('area', ar); if (led) sp.set('led', '1');
    history.replaceState(null, '', location.pathname + (sp.toString() ? '?' + sp : '') + location.hash);
  }
  const sp = new URLSearchParams(location.search);
  const pick = (el, v) => { if (v && [...el.options].some(o => o.value === v)) el.value = v; };
  q.value = sp.get('q') || ''; pick(fy, sp.get('year')); pick(fs, sp.get('status')); pick(fa, sp.get('area')); fl.checked = sp.get('led') === '1';
  let tmr = 0;
  q.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(filter, 90); });
  [fy, fs, fa, fl].forEach(el => el.addEventListener('change', filter));
  $('[data-p=reset]').addEventListener('click', () => { q.value = ''; fy.value = fs.value = fa.value = ''; fl.checked = false; filter(); q.focus(); });
  filter();

  /* ---- Selected ---- */
  const pins = (D.curation.selected_pins || []).map(x => ({ p: byNo.get(x.no), area: x.area })).filter(x => x.p);
  const groups = [];
  pins.forEach(x => { let g = groups.find(g => g.area === x.area); if (!g) groups.push(g = { area: x.area, items: [] }); g.items.push(x); });
  $('[data-p=pins]').innerHTML = groups.map(g => {
    const a = S.areaOf(g.area);
    return `<div class="area-group"><h3>${a ? `<b>${esc(a.numeral)}</b>${rich(a.title)}` : 'Other'}</h3>
      <ol class="papers">${g.items.map(x => S.paperCard(x.p, x.area, 'h4')).join('')}</ol></div>`;
  }).join('');
  $('[data-p=highlights]').innerHTML = (D.curation.recent_highlights || []).map(n => byNo.get(n)).filter(Boolean).map(p => S.paperCard(p, undefined, 'h3')).join('');
  $('[data-p=rules]').textContent = D.curation.rules || '';

  /* ---- Covers: complete images only, linked to the paper they belong to ---- */
  const coverItem = c => {
    const p = S.paperOfCover(c);
    const t = p ? plain(p.title) : '';
    const href = p ? S.paperHref(p) : S.secure(c.url);
    return `<li><figure><a class="cv" href="${esc(href || asset(c.image))}"><img data-src="${esc(asset(c.image))}" alt="${esc(t ? 'Journal cover: ' + t : 'Journal cover')}" decoding="async" width="300" height="400"></a>
      <figcaption>${p ? `<b>${rich(p.title)}</b>${esc(p.journal || '')}${p.year ? ', ' + esc(p.year) : ''}` : ''}</figcaption></figure></li>`;
  };
  const all = D.cover_publications || [];
  const fronts = all.filter(c => c.kind !== 'back_page'), backs = all.filter(c => c.kind === 'back_page');
  $('[data-p=fronts]').innerHTML = fronts.map(coverItem).join('');
  $('[data-p=backs]').innerHTML = backs.map(coverItem).join('');
  $('[data-p=cov-count]').textContent = `${fronts.length} covers` + (backs.length ? `, plus ${backs.length} back or inside cover pages` : '');

  /* ---- view switching by hash: #all, #selected, #covers ---- */
  const panes = [...document.querySelectorAll('[data-viewpane]')];
  const tabs = [...document.querySelectorAll('.tabs a[data-view]')];
  const tabBar = $('.tabs');
  function show(fromNav) {
    const h = location.hash.slice(1);
    const v = panes.some(p => p.dataset.viewpane === h) ? h : 'all';
    panes.forEach(p => { p.hidden = p.dataset.viewpane !== v; });
    tabs.forEach(a => (a.dataset.view === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    // the tab bar is sticky: put it at the top with the new view starting right under it
    if (fromNav) scrollTo({ top: $('#main').getBoundingClientRect().top + scrollY - tabBar.offsetHeight, behavior: 'instant' });
  }
  addEventListener('hashchange', () => show(true));
  show(false);
  S.lazyImages();
})();

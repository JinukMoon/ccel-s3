/* Shared helpers for the S3 candidate pages. Every fact comes from window.CCEL (_shared/content.js);
   this file only formats it. Exposed as window.S3. */
(function () {
  'use strict';
  const D = window.CCEL;
  const SHARED = '_shared/';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // title / authors / summary may carry <sub> and <sup> only: escape everything, then restore those two tags
  const rich = s => esc(s).replace(/&lt;(\/?)(sub|sup)&gt;/gi, '<$1$2>');
  const plain = s => String(s == null ? '' : s).replace(/<\/?(sub|sup)>/gi, '');
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const asset = p => (p ? SHARED + p : '');
  // legacy data still has a few non-TLS article links; upgrade them so the site never emits one
  const secure = u => (u ? String(u).trim().replace(/^http:\/\//i, 'https://') : '');
  const paperHref = p => (p.doi ? 'https://doi.org/' + p.doi : secure(p.url));

  const pubs = D.publications || [];
  const byNo = new Map(pubs.map(p => [p.no, p]));
  const areas = (D.research && D.research.areas) || [];
  const areaOf = n => areas.find(a => a.numeral === n) || null;

  /* citation_tail = "<authors>, <journal> <vol> (<year>) <pages>. (IF=x)"; keep the part after the authors */
  function source(p) {
    if (!p.journal && p.status !== 'published') return '';
    let t = String(p.citation_tail || '');
    const a = plain(p.authors);
    if (a && t.indexOf(a) === 0) t = t.slice(a.length);
    return t.replace(/^\s*,\s*/, '').replace(/\s*\(IF\s*=[^)]*\)\s*\.?\s*$/i, '').replace(/\.\s*$/, '').trim();
  }

  function authorsHTML(p) {
    const html = rich(p.authors);
    const names = (p.ccel_authors || []).filter(Boolean).map(esc).sort((a, b) => b.length - a.length);
    if (!names.length) return html;
    const re = new RegExp('(^|[\\s,>])(' + names.map(escRe).join('|') + ')(?=$|[\\s,<])', 'g');
    return html.replace(re, '$1<strong>$2</strong>');
  }

  function ifHTML(p) {
    if (p.impact_factor == null || p.impact_factor === '') return '';
    const v = esc(p.impact_factor);
    return p.if_provisional === true
      ? `<span class="if">IF ${v} <span class="prov" title="Provisional: latest JCR value available when the paper was added; replaced once the publication-year JIF is released">provisional</span></span>`
      : `<span class="if">IF ${v}</span>`;
  }

  const STATUS = { submitted: 'Submitted', 'in revision': 'In revision', accepted: 'Accepted', 'in press': 'In press' };
  const statusLabel = s => STATUS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const statusBadge = p => (p.status && p.status !== 'published'
    ? ` <span class="badge status">${esc(statusLabel(p.status))}${!p.journal && p.year ? ' ' + esc(p.year) : ''}</span>` : '');

  /* covers: attach only on DOI / URL / PII match, never by position */
  function keysOf(o) {
    const k = [];
    if (o.doi) k.push('doi:' + String(o.doi).toLowerCase());
    if (o.url) {
      const u = secure(o.url).toLowerCase();
      k.push('url:' + u.replace(/^https:\/\//, '').replace(/#.*$/, '').replace(/\/+$/, ''));
      const m = /(10\.\d{4,9}\/[^\s?#]+)/.exec(u); if (m) k.push('doi:' + m[1].replace(/\/+$/, ''));
      const q = /pii\/(s[0-9x]+)/i.exec(u); if (q) k.push('pii:' + q[1].toUpperCase());
    }
    if (o.pii) k.push('pii:' + String(o.pii).toUpperCase());
    return k;
  }
  let coverIdx = null, paperIdx = null;
  function coverOf(p, frontOnly) {
    if (!coverIdx) {
      coverIdx = new Map();
      (D.cover_publications || []).forEach(c => keysOf(c).forEach(k => { if (!coverIdx.has(k)) coverIdx.set(k, c); }));
    }
    for (const k of keysOf(p)) {
      const c = coverIdx.get(k);
      if (c && (!frontOnly || c.kind === 'front')) return c;
    }
    return null;
  }
  function paperOfCover(c) {
    if (!paperIdx) {
      paperIdx = new Map();
      pubs.forEach(p => keysOf(p).forEach(k => { if (!paperIdx.has(k)) paperIdx.set(k, p); }));
    }
    for (const k of keysOf(c)) { const p = paperIdx.get(k); if (p) return p; }
    return null;
  }

  /* one citation card; used by the landing page and the Selected view */
  function paperCard(p, areaNumeral, tag) {
    const a = areaOf(areaNumeral !== undefined ? areaNumeral : p.area);
    const c = coverOf(p, true);
    const href = paperHref(p);
    const t = plain(p.title);
    const media = c
      ? `<a class="paper-media" href="${esc(asset(c.image))}" aria-label="Journal cover for: ${esc(t)}"><img data-src="${esc(asset(c.image))}" alt="Journal cover: ${esc(t)}" decoding="async" width="96" height="128"></a>`
      : `<div class="paper-tile" aria-hidden="true">${a ? `<b>${esc(a.numeral)}</b><span>Area</span>` : '<b>&middot;</b>'}</div>`;
    const h = tag || 'h4';
    return `<li class="paper">${media}<div class="paper-body">
      ${a ? `<p class="paper-area">Area ${esc(a.numeral)} &middot; ${rich(a.title)}</p>` : ''}
      <${h} class="paper-title">${href ? `<a href="${esc(href)}">${rich(p.title)}</a>` : rich(p.title)}</${h}>
      <p class="paper-authors">${authorsHTML(p)}</p>
      <p class="paper-src">${esc(source(p))}${statusBadge(p)}</p>
      ${metaHTML(p, !!c)}
    </div></li>`;
  }
  function metaHTML(p, hasCover) {
    const bits = [];
    const f = ifHTML(p); if (f) bits.push(f);
    if (p.highlight) bits.push(`<span class="badge note">${esc(p.highlight)}</span>`);
    else if (hasCover) bits.push('<span class="badge note">Journal cover</span>');
    if (p.doi) bits.push(`<a href="https://doi.org/${esc(p.doi)}">doi:${esc(p.doi)}</a>`);
    else if (p.url) bits.push(`<a href="${esc(secure(p.url))}">Article page</a>`);
    return bits.length ? `<p class="paper-meta">${bits.join('')}</p>` : '';
  }

  /* people */
  const LINKS = [['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['scholar', 'Google Scholar'], ['cv', 'CV'], ['homepage', 'Homepage']];
  // self-contained 24x24 icons (no icon font, no CDN); filled marks for brands, outlined for CV and globe
  const svg = (body, stroke) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"${stroke
    ? ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' : ' fill="currentColor"'}>${body}</svg>`;
  const ICONS = {
    github: svg('<path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.2-1.3-5.2-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3 .7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.1v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z"/>'),
    linkedin: svg('<path d="M20.4 20.5h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.5-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1ZM7.1 20.5H3.6V9h3.5v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/>'),
    scholar: svg('<path d="M5.2 13.8 0 9.5 12 0l12 9.5-5.2 4.3A7.5 7.5 0 0 0 12 9.5a7.5 7.5 0 0 0-6.8 4.3ZM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"/>'),
    cv: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2"/>', true),
    homepage: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>', true),
  };
  // only links that are set; nothing at all (no row, no gap) when a person has none
  function linkIcons(links, who) {
    const items = LINKS.filter(([k]) => links && links[k]).map(([k, label]) => {
      const u = String(links[k]);
      const href = /^https?:\/\//i.test(u) ? secure(u) : asset(u);
      const t = `${who} — ${label}`;
      return `<li><a class="ilink" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(t)}" title="${esc(t)}">${ICONS[k]}</a></li>`;
    });
    return items.length ? `<ul class="ilinks" aria-label="${esc(who)} links">${items.join('')}</ul>` : '';
  }
  // professor.links uses google_scholar / cv
  const profLinks = p => linkIcons({ scholar: p.links && p.links.google_scholar, cv: p.links && p.links.cv }, p.name);
  // "Hwakyoung Seo (Vice Chief of Lab)" -> name + note, shown on two lines, nothing dropped
  function splitName(n) {
    const m = /^(.*?)\s*\((.+)\)\s*$/.exec(String(n || ''));
    return m ? { name: m[1], note: m[2] } : { name: String(n || ''), note: '' };
  }
  const initials = n => splitName(n).name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const TYPE = { computational: 'Computational', experimental: 'Experimental' };

  function personCard(p, group, opts) {
    opts = opts || {};
    const nm = splitName(p.name);
    const img = p.photo
      ? `<img data-src="${esc(asset(p.photo))}" alt="${esc(nm.name)}" decoding="async">`
      : `<span class="initials" aria-hidden="true">${esc(initials(p.name))}</span>`;
    const lines = [];
    lines.push(`<${opts.tag || 'h4'}>${esc(nm.name)}</${opts.tag || 'h4'}>`);
    lines.push(`<p class="role">${esc(group)}${nm.note ? ' &middot; ' + esc(nm.note) : ''}</p>`);
    if (p.type && TYPE[p.type]) lines.push(`<p class="type ${esc(p.type)}">${TYPE[p.type]}</p>`);
    if (opts.alumni) {
      if (p.current_position && !/^n\/?a$/i.test(String(p.current_position).trim())) lines.push(`<p class="now">${esc(p.current_position)}</p>`);
    } else if (p.research_area) lines.push(`<p class="focus">${esc(p.research_area)}</p>`);
    if (opts.full && p.degrees && p.degrees.length) lines.push('<ul class="deg">' + p.degrees.map(d => `<li>${esc(d)}</li>`).join('') + '</ul>');
    if (opts.full && (p.email || p.office)) {
      lines.push(`<p class="contact-line">${p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}${p.email && p.office ? '<br>' : ''}${p.office ? esc(p.office) : ''}</p>`);
    }
    return `<li class="person" data-type="${esc(p.type || '')}"><div class="ph">${img}</div><div class="body">${lines.join('')}${linkIcons(p.links, nm.name)}</div></li>`;
  }

  /* chrome: rail (desktop) doubles as the menu overlay (narrow), topbar logo, footer */
  const NAV = [
    ['01', 'Research', 'research', null],
    ['02', 'Publications', 'publications', 'publications.html'],
    ['03', 'People', 'people', 'members.html'],
    ['04', 'News', 'news', null],
    ['05', 'Join Us', 'join', null],
    ['06', 'Contact', 'contact', null],
  ];
  const logoAlt = () => `${D.lab.short} logo: ${D.lab.name}`;
  const logoImg = () => `<img class="ccel-logo" src="${esc(asset(D.lab.logo))}" alt="${esc(logoAlt())}" width="1304" height="664">`;

  function renderChrome(page) {
    const home = page === 'home';
    document.title = (page === 'home' ? '' : (page === 'members' ? 'People' : 'Publications') + ' | ') + `${D.lab.short}, ${D.lab.name}`;
    const navHref = n => (home ? '#' + n[2] : (n[3] || 'index.html#' + n[2]));
    const rail = document.getElementById('site-menu');
    rail.innerHTML = `
      <a class="ccel-logo-plate" href="index.html">${logoImg()}</a>
      <button class="rail-close" type="button">Close</button>
      <nav class="rail-nav" aria-label="Main"><ol>${NAV.map(n =>
        `<li><a href="${navHref(n)}" data-sec="${n[2]}"${(page === 'publications' && n[2] === 'publications') || (page === 'members' && n[2] === 'people') ? ' aria-current="page"' : ''}><span class="n">${n[0]}</span><span>${n[1]}</span></a></li>`).join('')}</ol></nav>
      <nav class="rail-pages" aria-label="Pages"><h2>Pages</h2><ul>
        ${home ? '' : '<li><a href="index.html">Home</a></li>'}
        <li><a href="members.html#professor">Professor</a></li>
        <li><a href="members.html">Members and alumni</a></li>
        <li><a href="publications.html">Publication list</a></li>
        <li><a href="publications.html#covers">Journal covers</a></li>
      </ul></nav>
      <p class="rail-mail">${esc(D.lab.affiliation)}<br><a href="mailto:${esc(D.contact.email)}">${esc(D.contact.email)}</a></p>`;

    /* narrow screens: Menu sits in the page header next to the logo (in flow, never over text).
       Once that header has scrolled away, a solid slim bar with the section name and Menu slides in
       on scroll-up and leaves on scroll-down. */
    const menuBtn = '<button class="menu-btn" type="button" aria-controls="site-menu" aria-expanded="false"><span class="bars" aria-hidden="true"></span>Menu</button>';
    document.querySelectorAll('[data-topbar]').forEach(el => {
      el.innerHTML = `<div class="topbar"><a class="ccel-logo-plate" href="index.html">${logoImg()}</a>${menuBtn}</div>`;
    });
    const bar = document.createElement('div');
    bar.className = 'minibar';
    bar.innerHTML = `<span class="minibar-label">${home ? '' : (page === 'members' ? 'People' : 'Publications')}</span>${menuBtn}`;
    document.body.appendChild(bar);

    let opener = null;
    const btns = () => document.querySelectorAll('.menu-btn');
    const close = () => { rail.classList.remove('is-open'); document.body.classList.remove('menu-open'); btns().forEach(b => b.setAttribute('aria-expanded', 'false')); };
    document.addEventListener('click', e => {
      const b = e.target.closest('.menu-btn'); if (!b) return;
      opener = b;
      rail.classList.add('is-open'); document.body.classList.add('menu-open'); b.setAttribute('aria-expanded', 'true');
      const first = rail.querySelector('.rail-nav a'); if (first) first.focus();
    });
    rail.querySelector('.rail-close').addEventListener('click', () => { close(); if (opener) opener.focus(); });
    rail.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && rail.classList.contains('is-open')) { close(); if (opener) opener.focus(); } });
    addEventListener('resize', () => { if (innerWidth >= 1100) { close(); showBar(false); } });

    let headInView = true, lastY = scrollY;
    const showBar = on => { bar.classList.toggle('is-shown', on); document.body.classList.toggle('bar-shown', on); };
    const head = document.querySelector('.topbar');
    if (head && 'IntersectionObserver' in window) {
      new IntersectionObserver(es => { headInView = es[0].isIntersecting; if (headInView) showBar(false); }).observe(head);
    }
    addEventListener('scroll', () => {
      const y = scrollY, dy = y - lastY;
      if (Math.abs(dy) < 6) return;
      lastY = y;
      if (innerWidth >= 1100 || document.body.classList.contains('menu-open')) return;
      showBar(dy < 0 && !headInView);
    }, { passive: true });

    const foot = document.querySelector('[data-foot]');
    if (foot) {
      const c = D.contact;
      foot.innerHTML = `<div class="wrap">
        <a class="ccel-logo-plate" href="index.html">${logoImg()}</a>
        <div><p><strong>${esc(c.lab_name)}</strong></p><p>${esc(c.address)}</p>
          <p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p></div>
        <nav aria-label="Footer"><ul>${NAV.map(n => `<li><a href="${home ? '#' + n[2] : (n[3] || 'index.html#' + n[2])}">${n[1]}</a></li>`).join('')}</ul></nav>
        <p class="copy">&copy; ${new Date().getFullYear()} ${esc(D.lab.short)}, ${esc(D.lab.affiliation)}</p>
      </div>`;
    }
  }

  /* hash targets are rendered by JS, so the browser's own jump happens too early: redo it once
     content, fonts and images have settled, unless the reader has already started scrolling */
  function landOnHash() {
    if (!location.hash || location.hash.length < 2) return;
    let userMoved = false;
    const mark = () => { userMoved = true; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(t => addEventListener(t, mark, { once: true, passive: true }));
    const go = () => {
      if (userMoved) return;
      const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) t.scrollIntoView({ behavior: 'instant', block: 'start' });
    };
    go();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    if (document.readyState === 'complete') setTimeout(go, 50); else addEventListener('load', () => setTimeout(go, 50), { once: true });
  }

  /* images are written with data-src and fetched when within ~1.5 screens; the browser's own lazy
     threshold reaches past the tall stage and pulled ~3 MB of research figures on first visit */
  function lazyImages() {
    const imgs = document.querySelectorAll('img[data-src]');
    const set = im => { im.src = im.dataset.src; im.removeAttribute('data-src'); };
    if (!('IntersectionObserver' in window)) { imgs.forEach(set); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { set(e.target); io.unobserve(e.target); } }),
      { rootMargin: '600px 0px' });
    imgs.forEach(im => io.observe(im));
  }

  // the slim bar names the section in view (landing) or the page (inner pages)
  const barLabel = html => { const l = document.querySelector('.minibar-label'); if (l) l.innerHTML = html; };

  let manifestP = null;
  const manifest = () => manifestP || (manifestP = fetch(SHARED + 'scroll/manifest.json').then(r => (r.ok ? r.json() : Promise.reject(r.status))));

  /* small static header art for inner pages: the hero poster, read from the manifest */
  function headerArt() {
    const box = document.querySelector('.page-head .art');
    if (!box) return;
    manifest().then(m => {
      const h = m.sequences && m.sequences.hero;
      if (!h || !h.poster) return;
      box.innerHTML = `<img src="${esc(SHARED + 'scroll/' + h.poster)}" alt="" width="${+h.width || ''}" height="${+h.height || ''}">`;
    }).catch(() => {});
  }

  window.S3 = {
    D, esc, rich, plain, escRe, asset, secure, paperHref, source, authorsHTML, ifHTML, statusLabel, statusBadge,
    coverOf, paperOfCover, byNo, areas, areaOf, paperCard, metaHTML, linkIcons, profLinks, splitName, initials, personCard,
    renderChrome, barLabel, landOnHash, lazyImages, manifest, headerArt, SHARED,
  };
})();

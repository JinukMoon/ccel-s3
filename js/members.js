/* Members page (round v6): current members by data group first; an Alumni button swaps in the alumni.
   No professor section (professor.html) and no group photo (contact.html). All from window.CCEL. */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc } = S;
  const $ = sel => document.querySelector(sel);
  const slug = (pre, s) => pre + '-' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // old links to the v5 sections that moved to their own pages
  const old = { professor: 'professor.html', 'group-photo': 'contact.html' }[location.hash.slice(1)];
  if (old) { location.replace(old); return; }

  S.renderChrome('members');
  S.headerArt();

  const groups = D.members || [], alumni = D.alumni || [];
  const nNow = groups.reduce((s, g) => s + g.people.length, 0);
  const nAlu = alumni.reduce((s, g) => s + g.people.length, 0);
  const prof = D.professor;
  $('[data-m=sub]').innerHTML = `<strong>${nNow}</strong> current members in ${groups.length} groups and <strong>${nAlu}</strong> alumni.
    <a class="sub-link" href="professor.html">Professor ${esc(prof.name)}</a>`;

  $('[data-m=jumps-current]').innerHTML = groups.map(g => `<a href="#${slug('g', g.group)}">${esc(g.group)}</a>`).join('');
  $('[data-m=jumps-alumni]').innerHTML = alumni.map(g => `<a href="#${slug('a', g.group)}">${esc(g.group)}</a>`).join('');

  const groupHTML = (g, pre, tag, opts) => `
    <section class="group" id="${slug(pre, g.group)}" aria-labelledby="h-${slug(pre, g.group)}">
      <div class="group-head"><${tag} id="h-${slug(pre, g.group)}">${esc(g.group)}</${tag}><span class="cnt" data-total="${g.people.length}">${g.people.length}</span></div>
      <ul class="people">${g.people.map(x => S.personCard(x, g.group, opts)).join('')}</ul>
    </section>`;
  $('[data-m=groups]').innerHTML = groups.map(g => groupHTML(g, 'g', 'h2', { full: true, tag: 'h3' })).join('');
  $('[data-m=alumni-count]').textContent = nAlu;
  $('[data-m=alumni]').innerHTML = alumni.map(g => groupHTML(g, 'a', 'h3', { alumni: true, full: true, tag: 'h4' })).join('');

  /* view switch. The hash is the state: "" or #current or #g-* = current members, #alumni or #a-* = alumni.
     Clicks push a history entry, so Back returns to the previous list; hashchange covers Back/Forward
     and hand-typed hashes. */
  const views = { current: $('#current'), alumni: $('#alumni') };
  const jumps = { current: $('[data-m=jumps-current]'), alumni: $('[data-m=jumps-alumni]') };
  const switchLinks = [...document.querySelectorAll('[data-view-link]')];
  const bar = $('.member-tabs');
  let view = null;
  const viewOf = id => (id === 'alumni' || /^a-/.test(id) ? 'alumni' : 'current');

  function setView(v) {
    if (v === view) return;
    view = v;
    Object.keys(views).forEach(k => { views[k].hidden = k !== v; jumps[k].hidden = k !== v; });
    switchLinks.forEach(a => (a.dataset.viewLink === v ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    S.barLabel(v === 'alumni' ? 'Members &middot; Alumni' : 'Members');
    applyFilter();
    // photos of the hidden list are already observed by S.lazyImages(); they load once shown and near
  }

  // the sticky bar is one row on wide screens and two rows on phones: anchors stop just below it
  const setBarH = () => document.documentElement.style.setProperty('--tabs-h', (bar ? bar.offsetHeight : 0) + 'px');
  setBarH();
  addEventListener('resize', setBarH);

  function route(how) {
    const id = decodeURIComponent(location.hash.slice(1));
    setView(viewOf(id));
    if (how === 'load') return;  // S.landOnHash() below places the target after render, fonts and load
    const t = id && document.getElementById(id);
    if (!t) return;
    S.hideBar();
    if (t === views.current || t === views.alumni) {
      // switching lists keeps the page where it is, unless the reader is already below the start of the list
      const y = t.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(t).scrollMarginTop) || 0);
      if (scrollY > y) scrollTo({ top: y, behavior: 'instant' });
    } else t.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('.member-tabs a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (a.getAttribute('href') !== location.hash) history.pushState(null, '', a.getAttribute('href'));
    route('click');
  });
  addEventListener('hashchange', () => route('nav'));
  addEventListener('popstate', () => route('nav'));

  /* computational / experimental filter; the coloured dots double as the legend of the cards */
  const seg = $('[data-m=seg]'), note = $('[data-m=seg-note]');
  let type = '';
  function applyFilter() {
    if (!view) return;
    const box = views[view];
    let shown = 0;
    box.querySelectorAll('.person').forEach(li => { const on = !type || li.dataset.type === type; li.hidden = !on; if (on) shown++; });
    box.querySelectorAll('.group').forEach(sec => {
      const n = sec.querySelectorAll('.person:not([hidden])').length, c = sec.querySelector('.cnt');
      c.textContent = type ? `${n} of ${c.dataset.total}` : c.dataset.total;
    });
    note.textContent = type ? `${shown} ${view === 'alumni' ? 'alumni' : 'current members'} with ${type} research` : '';
  }
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    type = b.dataset.type;
    seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    applyFilter();
  });

  route('load');
  S.lazyImages();
  S.landOnHash();
})();

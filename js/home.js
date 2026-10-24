/* Landing page: the key information only (stage, news, open position, selected publications, about,
   contact in the footer). Every fact comes from window.CCEL; the scroll stage itself lives in stage.js.
   No counts or totals are shown here (user decision 2026-10-25). */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc, rich, plain, asset, byNo } = S;
  const $ = sel => document.querySelector(sel);
  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  S.renderChrome('home', [
    { id: 'news', n: '01', label: 'News' },
    { id: 'opening', n: '02', label: 'Open Position' },
    { id: 'selected', n: '03', label: 'Selected Publications' },
    { id: 'about', n: '04', label: 'About CCEL' },
  ]);

  /* stage text: lab name and the lab's own identity line */
  const txt = { affiliation: D.lab.affiliation, name: D.lab.name, tagline: D.welcome.tagline };
  document.querySelectorAll('.stage [data-f]').forEach(el => { el.textContent = txt[el.dataset.f] || ''; });

  /* 01 News, 02 Open Position */
  fill('[data-n=news]', (D.welcome.news || []).map(n =>
    `<li>${n.date ? `<time>${esc(n.date)}</time>` : ''}${esc(n.text)}</li>`).join(''));
  const prof = D.professor;
  fill('[data-n=opening]', `<p lang="ko">${esc(D.welcome.opening_ko)}</p>
    <a class="btn" href="mailto:${esc(prof.email)}">Email ${esc(prof.name)}</a>`);

  /* 03 Selected Publications: the professor's pins, compact (title, journal line, DOI) */
  const pins = (D.curation.selected_pins || []).map(x => ({ p: byNo.get(x.no), area: x.area })).filter(x => x.p);
  fill('[data-p=pins]', pins.map(({ p, area }) => {
    const a = S.areaOf(area !== undefined ? area : p.area);
    const href = S.paperHref(p);
    const doi = p.doi ? `<a href="https://doi.org/${esc(p.doi)}">doi:${esc(p.doi)}</a>`
      : (p.url ? `<a href="${esc(S.secure(p.url))}">Article page</a>` : '');
    return `<li class="pin">
      ${a ? `<p class="pin-area"><b>${esc(a.numeral)}</b>${rich(a.title)}</p>` : ''}
      <h3 class="pin-title">${href ? `<a href="${esc(href)}">${rich(p.title)}</a>` : rich(p.title)}</h3>
      <p class="pin-src">${esc(S.source(p))}${S.statusBadge(p)}</p>
      ${doi ? `<p class="pin-doi">${doi}</p>` : ''}
    </li>`;
  }).join(''));

  /* 04 About CCEL: the Korean lab introduction (as on the current site) beside the research-loop figure */
  const r = D.research;
  fill('[data-a=about]', `
    <div class="about-text">
      ${D.welcome.about_ko ? `<p lang="ko">${esc(D.welcome.about_ko)}</p>` : ''}
      <p><a class="more" href="research.html">Research areas</a></p>
    </div>
    ${r.image ? `<figure class="figure"><img data-src="${esc(asset(r.image))}" alt="Research approach of ${esc(D.lab.short)}: computational design, AI screening, experimental validation and analysis" decoding="async" width="3646" height="2240">
      <figcaption>Research approach: computation, AI and experiment in one loop.</figcaption></figure>` : ''}`);

  S.spy('Welcome');
  S.lazyImages();
  S.landOnHash();
})();

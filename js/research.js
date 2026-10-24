/* Research page: intro + research-loop figure, the five areas (figure, summary, keywords, key papers),
   sponsors. Moved here from the landing page in round v5. All from window.CCEL. */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc, rich, plain, asset, byNo } = S;
  const $ = sel => document.querySelector(sel);
  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  const r = D.research;

  S.renderChrome('research', S.areas.map(a => ({ id: 'area-' + a.numeral, n: a.numeral, label: rich(a.title) })));
  S.headerArt();

  fill('[data-r=headline]', esc(r.headline || ''));
  fill('[data-r=intro]', (r.intro || []).map((p, i) => `<p${i === 0 ? ' class="lede"' : ''}>${rich(p)}</p>`).join(''));
  if (r.image) {
    fill('[data-r=figure]', `<img data-src="${esc(asset(r.image))}" alt="Research approach of ${esc(D.lab.short)}: computational design, AI screening, experimental validation and analysis" decoding="async" width="3646" height="2240">
      <figcaption>Research approach: computation, AI and experiment in one loop.</figcaption>`);
  }

  /* key papers per area = that area's pins, then recent highlights in the same area (no own ranking) */
  const pins = (D.curation.selected_pins || []).map(x => ({ p: byNo.get(x.no), area: x.area })).filter(x => x.p);
  const highlights = (D.curation.recent_highlights || []).map(n => byNo.get(n)).filter(Boolean);
  // the data repeats "I. <title>" at the start of each summary; the heading already shows it
  const summary = a => rich(String(a.summary || '').replace(new RegExp('^\\s*' + S.escRe(a.numeral) + '\\.\\s*' + S.escRe(a.title) + '\\s*'), ''));
  const short = p => `<a href="${esc(S.paperHref(p))}">${rich(p.title)}</a> <span class="label">${esc(p.journal || S.statusLabel(p.status))}${p.year ? ', ' + esc(p.year) : ''}</span>`;

  fill('[data-r=areas]', S.areas.map(a => {
    const key = [];
    pins.filter(x => x.area === a.numeral).forEach(x => key.push(x.p));
    highlights.filter(p => p.area === a.numeral && !key.includes(p)).forEach(p => key.push(p));
    const t = plain(a.title);
    return `<li class="area" id="area-${esc(a.numeral)}">
      <figure class="area-fig">${a.image ? `<img data-src="${esc(asset(a.image))}" alt="${esc(t)}" decoding="async" width="800" height="800">` : ''}</figure>
      <div>
        <p class="area-num"><b>${esc(a.numeral)}</b>Research area</p>
        <h2 class="area-title">${rich(a.title)}</h2>
        <p class="area-sum">${summary(a)}</p>
        ${(a.keywords || []).length ? `<ul class="kw" aria-label="Keywords">${a.keywords.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}
        ${key.length ? `<p class="area-papers-h">Key papers</p><ul class="area-papers">${key.slice(0, 3).map(p => `<li>${short(p)}</li>`).join('')}</ul>` : ''}
        <p class="area-foot"><a class="more" href="publications.html?area=${encodeURIComponent(a.numeral)}">Papers in this area</a></p>
      </div></li>`;
  }).join(''));

  fill('[data-r=sponsors]', (r.sponsors || []).map(s => `<li><img data-src="${esc(asset(s))}" alt="Sponsor logo" decoding="async"></li>`).join(''));

  S.spy('Research');
  S.lazyImages();
  S.landOnHash();
})();

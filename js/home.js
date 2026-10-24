/* Landing page: renders every section from window.CCEL. The scroll stage itself lives in stage.js. */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc, rich, plain, asset, byNo } = S;
  const $ = sel => document.querySelector(sel);
  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  S.renderChrome('home');

  /* stage text */
  const txt = { affiliation: D.lab.affiliation, name: D.lab.name, headline: D.research.headline };
  document.querySelectorAll('.stage [data-f]').forEach(el => { el.textContent = txt[el.dataset.f] || ''; });

  /* 01 Research */
  const r = D.research;
  fill('[data-r=intro]', (r.intro || []).map((p, i) => `<p${i === 0 ? ' class="lede"' : ''}>${rich(p)}</p>`).join('') +
    (D.welcome.about_ko ? `<details class="ko-about"><summary>About the lab (Korean)</summary><p lang="ko">${esc(D.welcome.about_ko)}</p></details>` : ''));
  if (r.image) {
    fill('[data-r=figure]', `<img data-src="${esc(asset(r.image))}" alt="Research approach of ${esc(D.lab.short)}: computational design, AI screening, experimental validation and analysis" decoding="async" width="3646" height="2240">
      <figcaption>Research approach: computation, AI and experiment in one loop.</figcaption>`);
  }

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
        <h3>${rich(a.title)}</h3>
        <p class="area-sum">${summary(a)}</p>
        ${(a.keywords || []).length ? `<ul class="kw" aria-label="Keywords">${a.keywords.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}
        ${key.length ? `<p class="area-papers-h">Key papers</p><ul class="area-papers">${key.slice(0, 3).map(p => `<li>${short(p)}</li>`).join('')}</ul>` : ''}
        <p class="area-foot"><a class="more" href="publications.html?area=${encodeURIComponent(a.numeral)}">Papers in this area</a></p>
      </div></li>`;
  }).join(''));

  /* 02 Publications */
  fill('[data-p=pins]', pins.map(x => S.paperCard(x.p, x.area)).join(''));
  fill('[data-p=highlights]', highlights.map(p => S.paperCard(p)).join(''));
  fill('[data-p=rules]', esc(D.curation.rules || ''));
  const pubs = D.publications;
  const published = pubs.filter(p => p.status === 'published');
  const pending = pubs.length - published.length;
  const years = pubs.map(p => p.year).filter(Boolean);
  const fronts = (D.cover_publications || []).filter(c => c.kind === 'front').length;
  fill('[data-p=facts]', `
    <span><strong>${published.length}</strong> published papers, ${Math.min(...years)}&ndash;${Math.max(...years)}</span>
    ${pending ? `<span><strong>${pending}</strong> submitted, in revision or in press</span>` : ''}
    <span><strong>${fronts}</strong> journal covers</span>
    <a class="more" href="publications.html#covers">Covers</a>
    <a class="more" href="publications.html">All publications</a>`);

  /* 03 People */
  const prof = D.professor;
  fill('[data-m=prof]', `
    <img data-src="${esc(asset(prof.photo))}" alt="${esc(prof.name)}" decoding="async" width="413" height="531">
    <div>
      <h3>${esc(prof.name)}</h3>
      <p>${esc(prof.title)}</p>
      ${(prof.roles || []).map(x => `<p class="small">${esc(x)}</p>`).join('')}
      <p class="links">
        <a href="mailto:${esc(prof.email)}">${esc(prof.email)}</a>
        <a class="more" href="members.html#professor">Profile</a>
      </p>
      ${S.profLinks(prof)}
    </div>`);
  const all = D.members.flatMap(g => g.people);
  const nType = t => all.filter(p => p.type === t).length;
  const nAlumni = (D.alumni || []).reduce((s, g) => s + g.people.length, 0);
  fill('[data-m=counts]', D.members.map(g => `<li><strong>${g.people.length}</strong>${esc(g.group)}</li>`).join('') +
    `<li><strong>${nType('computational')}</strong>computational</li><li><strong>${nType('experimental')}</strong>experimental</li>` +
    (nAlumni ? `<li><strong>${nAlumni}</strong><a href="members.html#alumni">alumni</a></li>` : ''));
  const first = D.members[0];
  if (first) {
    fill('[data-m=preview-title]', esc(first.group));
    fill('[data-m=preview]', first.people.map(p => S.personCard(p, first.group)).join(''));
  }

  /* 04 News, 05 Join Us */
  fill('[data-n=news]', (D.welcome.news || []).map((n, i) =>
    `<li><span class="i">${String(i + 1).padStart(2, '0')}</span><div>${n.date ? `<time>${esc(n.date)}</time>` : ''}${esc(n.text)}</div></li>`).join(''));
  fill('[data-n=join]', `<p lang="ko">${esc(D.welcome.opening_ko)}</p>
    <a class="btn" href="mailto:${esc(prof.email)}">Email ${esc(prof.name)}</a>`);

  /* 06 Contact */
  const c = D.contact;
  const row = (k, v) => (v ? `<dt>${k}</dt><dd>${v}</dd>` : '');
  fill('[data-c=contact]', `
    <dl>
      ${row('Laboratory', esc(c.lab_name))}
      ${row('Address', esc(c.address))}
      ${row('Email', c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '')}
      ${row('Professor office', esc(c.professor_office))}
      ${row('Laboratory rooms', esc(c.laboratory))}
      ${row('Student office', esc(c.student_office))}
    </dl>
    ${c.group_photo ? `<figure class="figure"><img data-src="${esc(asset(c.group_photo))}" alt="${esc(D.lab.short)} group photo" decoding="async" width="6944" height="4496"><figcaption>${esc(D.lab.short)} group photo</figcaption></figure>` : ''}`);
  fill('[data-c=sponsors]', (r.sponsors || []).map(s => `<li><img data-src="${esc(asset(s))}" alt="Sponsor logo" decoding="async"></li>`).join(''));

  /* numbered nav follows the section in view */
  const links = [...document.querySelectorAll('.rail-nav a[data-sec]')];
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => {
        if (a.dataset.sec !== e.target.id) return a.removeAttribute('aria-current');
        a.setAttribute('aria-current', 'location'); S.barLabel(a.innerHTML);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['research', 'publications', 'people', 'news', 'join', 'contact'].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
  const stage = document.querySelector('[data-stage]');
  if (stage) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.removeAttribute('aria-current')); }),
    { rootMargin: '-45% 0px -50% 0px' }).observe(stage);

  S.lazyImages();
  S.landOnHash();
})();

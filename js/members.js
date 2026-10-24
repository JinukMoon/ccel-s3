/* People page: professor, current members by data group, alumni. All from window.CCEL. */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc, asset } = S;
  const $ = sel => document.querySelector(sel);
  const slug = s => 'g-' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  S.renderChrome('members');
  S.headerArt();

  const groups = D.members || [], alumni = D.alumni || [];
  const nNow = groups.reduce((s, g) => s + g.people.length, 0);
  const nAlu = alumni.reduce((s, g) => s + g.people.length, 0);
  $('[data-m=sub]').innerHTML = `<strong>${nNow}</strong> current members in ${groups.length} groups and <strong>${nAlu}</strong> alumni.`;

  $('[data-m=tabs]').innerHTML = ['<a href="#professor">Professor</a>']
    .concat(groups.map(g => `<a href="#${slug(g.group)}">${esc(g.group)}</a>`), ['<a href="#alumni">Alumni</a>']).join('');

  /* professor */
  const p = D.professor;
  const edu = [];
  ((p.sections && p.sections.Education) || []).forEach(l => {
    const t = String(l).replace(/^\s*✔\s*/, '').replace(/\s+,/g, ',').trim();
    if (!t || t === 'Education') return;
    if (/^Advisor:/i.test(t) && edu.length) edu[edu.length - 1] += ' — ' + t; else edu.push(t);
  });
  $('[data-m=prof]').innerHTML = `
    <div class="group-head"><h2 id="h-prof">Professor</h2></div>
    <div class="prof-full">
      <img src="${esc(asset(p.photo))}" alt="${esc(p.name)}" width="413" height="531" decoding="async">
      <div>
        <h3 class="prof-name">${esc(p.name)}</h3>
        <p>${esc(p.title)}</p>
        ${(p.roles || []).map(r => `<p class="small">${esc(r)}</p>`).join('')}
        <p class="prof-links"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
        ${S.profLinks(p)}
        ${edu.length ? `<h4>Education</h4><ul class="edu">${edu.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
        ${p.links && p.links.cv ? `<p class="small">Appointments and editorial service are listed in the <a href="${esc(asset(p.links.cv))}">CV</a>.</p>` : ''}
      </div>
    </div>`;

  /* current members */
  $('[data-m=groups]').innerHTML = groups.map(g => `
    <section class="group" id="${slug(g.group)}" aria-labelledby="h-${slug(g.group)}">
      <div class="group-head"><h2 id="h-${slug(g.group)}">${esc(g.group)}</h2><span class="cnt" data-total="${g.people.length}">${g.people.length}</span></div>
      <ul class="people">${g.people.map(x => S.personCard(x, g.group, { full: true, tag: 'h3' })).join('')}</ul>
    </section>`).join('');

  /* alumni */
  $('[data-m=alumni-count]').textContent = nAlu;
  $('[data-m=alumni]').innerHTML = alumni.map(g => `
    <div class="area-group">
      <h3>${esc(g.group)} <span class="small">${g.people.length}</span></h3>
      <ul class="people">${g.people.map(x => S.personCard(x, g.group, { alumni: true, full: true, tag: 'h4' })).join('')}</ul>
    </div>`).join('');

  /* computational / experimental filter */
  const seg = $('[data-m=seg]'), note = $('[data-m=seg-note]');
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const t = b.dataset.type;
    seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    let shown = 0;
    document.querySelectorAll('.person').forEach(li => { const on = !t || li.dataset.type === t; li.hidden = !on; if (on && !li.closest('.alumni')) shown++; });
    document.querySelectorAll('[data-m=groups] .group').forEach(sec => {
      const n = sec.querySelectorAll('.person:not([hidden])').length, c = sec.querySelector('.cnt');
      c.textContent = t ? `${n} of ${c.dataset.total}` : c.dataset.total;
    });
    document.querySelectorAll('.alumni .area-group').forEach(gr => { gr.hidden = !gr.querySelector('.person:not([hidden])'); });
    note.textContent = t ? `${shown} current members with ${t} research` : '';
  });

  S.lazyImages();
  S.landOnHash();
})();

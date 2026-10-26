/* Professor page (round v6): the professor only, and only what the current prof.html shows (user rule
   2026-10-26: no office/phone, bio, interests, awards, counts or extra links). Profile from `professor`
   (+ the street address from `contact`), then Education, Experience and Service from the structured `professor.education`,
   `professor.experience` and `professor.service`. Nothing about students here. All from window.CCEL. */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc, asset } = S;
  const $ = sel => document.querySelector(sel);
  const p = D.professor, c = D.contact;

  S.renderChrome('professor', [
    { id: 'profile', n: '01', label: 'Profile' },
    { id: 'education', n: '02', label: 'Education' },
    { id: 'experience', n: '03', label: 'Experience' },
  ].concat((p.service || []).length ? [{ id: 'service', n: '04', label: 'Service' }] : []));
  S.headerArt();

  const period = t => esc(String(t || '').replace(/\s+-\s+/g, ' \u2013 '));  // "Mar. 2026 - current" -> en dash

  /* ---- 01 profile ---- */
  // title = "Professor, Department of ..., Seoul National University" -> position + department line
  const ti = String(p.title || ''), cut = ti.indexOf(',');
  const position = cut > 0 ? ti.slice(0, cut).trim() : ti, dept = cut > 0 ? ti.slice(cut + 1).trim() : '';
  // "Jeong Woo Han, Ph.D." as on the current page: the doctoral degree from `education`
  const phd = (p.education || []).find(e => /^Ph\.?\s?D/i.test(String(e.degree || '')));
  // contact.address repeats the department; keep only the street part when it does
  let street = String(c.address || '');
  if (dept && street.indexOf(dept) === 0) street = street.slice(dept.length).replace(/^\s*,\s*/, '');
  const L = p.links || {};
  const btn = (href, icon, label) => `<a class="lbtn" href="${esc(href)}" target="_blank" rel="noopener">${S.ICONS[icon]}<span>${label}</span></a>`;
  const row = (k, v) => (v ? `<dt>${k}</dt><dd>${v}</dd>` : '');
  $('[data-pr=profile]').innerHTML = `
    <header class="sec-head"><span class="sec-num">01</span><h2 id="h-prof">${esc(p.name)}${phd ? ', ' + esc(phd.degree) : ''}</h2></header>
    <div class="prof-grid">
      <figure class="prof-photo"><img src="${esc(asset(p.photo))}" alt="${esc(p.name)}" width="413" height="531" decoding="async" fetchpriority="high"></figure>
      <div class="prof-info">
        <p class="prof-pos">${esc(position)}</p>
        ${(p.roles || []).map(r => `<p class="prof-role">${esc(r)}</p>`).join('')}
        ${dept ? `<p class="prof-dept">${esc(dept)}</p>` : ''}
        <dl class="prof-dl">
          ${row('Address', esc(street))}
          ${row('Email', p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '')}
        </dl>
        ${(L.google_scholar || L.cv) ? `<p class="prof-btns">
          ${L.google_scholar ? btn(S.secure(L.google_scholar), 'scholar', 'Google Citation') : ''}
          ${L.cv ? btn(/^https?:/i.test(L.cv) ? S.secure(L.cv) : asset(L.cv), 'cv', 'Curriculum Vitae') : ''}</p>` : ''}
      </div>
    </div>`;

  /* ---- 02 education ---- */
  $('[data-pr=education]').innerHTML = (p.education || []).map(e => `<li class="cv-row">
      <p class="cv-date">${esc(e.date)}</p>
      <div>
        <h3 class="cv-what">${esc(e.degree)}, ${esc(e.field)}${e.honors ? ` (${esc(e.honors)})` : ''}</h3>
        <p class="cv-org">${esc(e.institution)}${e.location ? ', ' + esc(e.location) : ''}</p>
        ${e.thesis ? `<p class="cv-note">&ldquo;${esc(e.thesis)}&rdquo;</p>` : ''}
        ${e.advisor ? `<p class="cv-note">Advisor: ${esc(e.advisor)}</p>` : ''}
      </div>
    </li>`).join('');

  /* ---- 03 experience: per institution, newest first, as in the data ---- */
  $('[data-pr=experience]').innerHTML = (p.experience || []).map(g => `<li class="cv-group">
      <h3 class="cv-inst">${esc(g.institution)}${g.location ? ` <span class="cv-loc">${esc(g.location)}</span>` : ''}</h3>
      <ul class="cv-roles">${(g.roles || []).map(r => `<li class="cv-row"><p class="cv-date">${period(r.period)}</p>
        <div><p class="cv-what">${esc(r.title)}${r.unit ? `<span class="cv-unit">, ${esc(r.unit)}</span>` : ''}</p></div></li>`).join('')}</ul>
    </li>`).join('');

  /* ---- 04 editorial and professional service ---- */
  $('[data-pr=service]').innerHTML = (p.service || []).map(x => `<li class="cv-row"><p class="cv-date">${period(x.period)}</p>
      <div><p class="cv-what">${esc(x.title)}<span class="cv-unit">, ${esc(x.organization)}</span></p></div></li>`).join('');
  if (!(p.service || []).length) $('#service').remove();

  S.spy('Professor');
  S.landOnHash();
})();

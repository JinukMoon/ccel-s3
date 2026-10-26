/* Contact page (round v6), as on the current Contact Us page: group photo, lab name, address, email,
   professor office, laboratory and student office. All from window.CCEL `contact`; no map, no form. */
(function () {
  'use strict';
  const S = window.S3, D = S.D, { esc, asset } = S;
  const $ = sel => document.querySelector(sel);
  const c = D.contact;

  S.renderChrome('contact');
  S.headerArt();

  const photo = $('[data-c=photo]');
  if (c.group_photo) {
    const src = esc(asset(c.group_photo));
    photo.innerHTML = `<a href="${src}" aria-label="${esc(D.lab.short)} group photo, full size"><img src="${src}" alt="${esc(D.lab.short)} group photo" width="6944" height="4496" decoding="async" fetchpriority="high"></a>`;
  } else photo.remove();

  const item = (k, v) => (v ? `<div class="contact-item"><dt>${k}</dt><dd>${v}</dd></div>` : '');
  $('[data-c=details]').innerHTML = `
    <h2 id="h-lab">${esc(c.lab_name)}</h2>
    <dl class="contact-dl">
      ${item('Address', esc(c.address))}
      ${item('Email', c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '')}
      ${item('Professor office', esc(c.professor_office))}
      ${item('Laboratory', esc(c.laboratory))}
      ${item('Student office', esc(c.student_office))}
    </dl>`;

  S.landOnHash();
})();

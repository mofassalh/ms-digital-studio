/* MS Biz Studio — English pages: lead forms go through our own /api/contact,
   so the destination inbox never appears on the site. */
(function () {
  /* "Email us" opens a small message form; it is sent through /api/contact,
     so the inbox address is never shown on the page */
  var dlg = document.createElement('dialog');
  dlg.className = 'mail';
  dlg.setAttribute('aria-label', 'Email us');
  dlg.innerHTML =
    '<button type="button" class="close" aria-label="Close">×</button>' +
    '<div class="form-card"><div class="head" style="margin:0"><h2>Email us</h2><p class="muted">Write your message and we\'ll reply.</p></div>' +
    '<form class="lead" data-need="Email (EN)" novalidate>' +
    '<label>Your name<input name="name" type="text" autocomplete="name" required></label>' +
    '<label>Email<input name="email" type="email" autocomplete="email" required></label>' +
    '<label>Message<textarea name="details" rows="4"></textarea></label>' +
    '<div class="hp" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>' +
    '<button class="btn" type="submit">Send</button><p class="msg" role="status" aria-live="polite"></p></form></div>';
  document.body.appendChild(dlg);
  dlg.querySelector('.close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  document.querySelectorAll('[data-mail]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (dlg.showModal) dlg.showModal(); else location.hash = '#contact';
      var f = dlg.querySelector('input[name="name"]'); if (f) f.focus();
    });
  });
  /* Bangladesh visitors on the homepage get the Bangla homepage,
     unless they chose English (the EN switch on a Bangla page, or ?lang=en) */
  var path = location.pathname;
  if (path === '/' || path === '/index.html') {
    var keepEn = false;
    try {
      if (/lang=en/.test(location.search)) localStorage.setItem('msbiz_lang', 'en');
      keepEn = localStorage.getItem('msbiz_lang') === 'en';
    } catch (e) {}
    if (!keepEn) {
      fetch('/api/geo').then(function (r) { return r.json(); }).then(function (d) {
        if (d.country === 'BD') location.replace('/bn/');
      }).catch(function () {});
    }
  }

  /* Choosing Bangla clears an earlier English choice */
  document.querySelectorAll('a[data-bn]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.removeItem('msbiz_lang'); } catch (e) {}
    });
  });

  document.querySelectorAll('form.lead').forEach(function (form) {
    var msg = form.querySelector('.msg');
    var btn = form.querySelector('button[type="submit"]');
    var say = function (text, ok) {
      msg.textContent = text;
      msg.className = 'msg ' + (ok ? 'ok' : 'err');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email ? form.email.value.trim() : '';
      var phone = form.phone ? form.phone.value.replace(/[^\d+]/g, '') : '';
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name) { say('Please enter your name.', false); form.name.focus(); return; }
      if (!emailOk && phone.replace(/\D/g, '').length < 7) {
        say('Please enter a valid email address.', false); form.email.focus(); return;
      }

      var payload = {
        name: name,
        email: email,
        phone: phone,
        company: form.company ? form.company.value.trim() : '',
        city: form.city ? form.city.value.trim() : '',
        details: form.details ? form.details.value.trim() : '',
        need: form.getAttribute('data-need') || 'Enquiry (EN)',
        page: location.pathname,
        website: form.website ? form.website.value : ''
      };

      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'Sending…';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) {
          form.reset();
          say('Thank you! We will get back to you shortly.', true);
        } else {
          say("Couldn't send. Please try again in a moment, or email us.", false);
        }
      }).catch(function () {
        say("Couldn't send. Please try again in a moment, or email us.", false);
      }).then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  });
})();

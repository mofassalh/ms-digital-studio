/* MS Biz Studio — English pages: lead forms go through our own /api/contact,
   so the destination inbox never appears on the site. */
(function () {
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

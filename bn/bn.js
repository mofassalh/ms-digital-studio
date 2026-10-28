/* MS Biz Studio — Bangla pages: lead forms go through our own /api/contact,
   so the destination inbox never appears on the site. */
(function () {
  var toLatin = function (s) {
    return String(s || '').replace(/[০-৯]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.indexOf(d); });
  };

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
      var phone = toLatin(form.phone.value).replace(/[^\d+]/g, '');
      if (!name) { say('আপনার নাম লিখুন।', false); form.name.focus(); return; }
      if (phone.replace(/\D/g, '').length < 10) { say('সঠিক মোবাইল নম্বর লিখুন।', false); form.phone.focus(); return; }

      var payload = {
        name: name,
        phone: phone,
        company: form.company ? form.company.value.trim() : '',
        city: form.city ? form.city.value.trim() : '',
        details: form.details ? form.details.value.trim() : '',
        need: form.getAttribute('data-need') || 'Bangla lead',
        page: location.pathname,
        website: form.website ? form.website.value : ''
      };

      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'পাঠানো হচ্ছে…';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) {
          form.reset();
          say('ধন্যবাদ! আমরা শিগগিরই আপনাকে ফোন করব।', true);
        } else {
          say('পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন, বা ইমেইল করুন।', false);
        }
      }).catch(function () {
        say('পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন, বা ইমেইল করুন।', false);
      }).then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  });

  /* Someone who chose English keeps English on the main site */
  document.querySelectorAll('a[data-en]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('msbiz_lang', 'en'); } catch (e) {}
    });
  });
  try { localStorage.removeItem('msbiz_lang'); } catch (e) {}
})();

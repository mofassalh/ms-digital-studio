/* MS Biz Studio — shared scripts */
(function () {
  document.documentElement.classList.remove('no-js');

  /* Mobile menu */
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.innerHTML = open
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && menu.classList.contains('open')) btn.click();
    });
  }

  /* Scroll reveal */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('visible'); });
  }

  /* Testimonial slider */
  var slides = document.querySelectorAll('.slide');
  if (slides.length) {
    var dots = document.querySelectorAll('.dot');
    var current = 0, timer;
    var show = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('active', n === current); });
      dots.forEach(function (d, n) { d.setAttribute('aria-current', n === current ? 'true' : 'false'); });
    };
    var start = function () { clearInterval(timer); timer = setInterval(function () { show(current + 1); }, 7000); };
    var prev = document.querySelector('[data-prev]');
    var next = document.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { show(current - 1); start(); });
    if (next) next.addEventListener('click', function () { show(current + 1); start(); });
    dots.forEach(function (d, n) { d.addEventListener('click', function () { show(n); start(); }); });
    var wrap = document.querySelector('.slides');
    if (wrap) {
      wrap.addEventListener('mouseenter', function () { clearInterval(timer); });
      wrap.addEventListener('mouseleave', start);
    }
    show(0); start();
  }

  /* Portfolio filter */
  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        var tag = f.getAttribute('data-filter');
        filters.forEach(function (x) { x.setAttribute('aria-pressed', x === f ? 'true' : 'false'); });
        document.querySelectorAll('.case[data-tags]').forEach(function (c) {
          var show = tag === 'all' || c.getAttribute('data-tags').split(',').indexOf(tag) > -1;
          c.classList.toggle('hide', !show);
        });
      });
    });
  }

  /* Contact form: sent through our own server, so no email address appears on the site */
  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var details = form.details.value.trim();
      var err = document.getElementById('form-error');
      var btn = form.querySelector('button[type="submit"]');
      if (!name || !details || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.style.display = 'block';
        err.textContent = 'Please add your name, a valid email and a few words about your project.';
        return;
      }
      err.style.display = 'none';
      var need = (form.querySelector('input[name="need"]:checked') || {}).value || 'Not sure yet';
      var label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = 'Sending…';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name, email: email, company: form.company.value.trim(), need: need,
          budget: form.budget.value, details: details, website: form.website ? form.website.value : '',
          page: location.pathname
        })
      }).then(function (r) { if (!r.ok) throw new Error('send failed'); return r.json(); })
        .then(function () {
          form.style.display = 'none';
          document.getElementById('form-done').style.display = 'flex';
        })
        .catch(function () {
          err.style.display = 'block';
          err.textContent = 'Sorry, your message could not be sent. Please try again in a minute.';
        })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
    var again = document.getElementById('form-again');
    if (again) again.addEventListener('click', function () {
      form.reset(); form.style.display = 'flex';
      document.getElementById('form-done').style.display = 'none';
    });
  }

  document.querySelectorAll('[data-call]').forEach(function (a) {
    a.addEventListener('click', function () {
      var t = document.querySelector('#lead-form textarea[name="details"]');
      if (t && !t.value) t.value = "I'd like to book a free 30-minute call. Best days/times for me: ";
      setTimeout(function () { var n = document.querySelector('#lead-form input[name="name"]'); if (n) n.focus(); }, 400);
    });
  });

  /* Preselect the service from ?need= on the contact page */
  try {
    var need = new URLSearchParams(location.search).get('need');
    if (need) { var r = document.querySelector('input[data-key="' + need.replace(/[^a-z]/g, '') + '"]'); if (r) r.checked = true; }
  } catch (e) {}

  /* Bangladesh visitors see BDT prices and the Bangla restaurant page */
  function toBD() {
    document.querySelectorAll('[data-bd]').forEach(function (el) { el.textContent = el.getAttribute('data-bd'); });
    document.querySelectorAll('[data-bd-href]').forEach(function (el) { el.setAttribute('href', el.getAttribute('data-bd-href')); });
  }
  /* Bangladesh visitors on the homepage go to the Bangla homepage,
     unless they chose English (?lang=en or the "English" link on a Bangla page) */
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

  if (document.querySelector('[data-bd],[data-bd-href]')) {
    fetch('/api/geo').then(function (r) { return r.json(); }).then(function (d) {
      if (d.country === 'BD') toBD();
    }).catch(function () {
      try { if (/Asia\/(Dhaka|Dacca)/.test(Intl.DateTimeFormat().resolvedOptions().timeZone || '')) toBD(); } catch (e) {}
    });
  }
})();

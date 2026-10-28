// Contact form handler for msbizstudio.com
// The destination inbox is stored ONLY in the Vercel environment variable CONTACT_EMAIL,
// so it never appears in the website code or in this public repository.
// Messages are delivered through FormSubmit (formsubmit.co). The very first message
// triggers a one-time "Activate form" email to that inbox — click Activate once.

export const config = { runtime: 'edge' };

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export default async function handler(request) {
  const json = (data, status) => new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const to = process.env.CONTACT_EMAIL;
  if (!to) return json({ ok: false, error: 'Contact form is not configured yet' }, 500);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'Bad request' }, 400); }

  // Honeypot: real visitors never fill the hidden "website" field
  if (body.website) return json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const details = String(body.details || '').trim().slice(0, 5000);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // Bangla pages ask for a phone number instead of an email address
  const phone = clean(body.phone, 30).replace(/[^\d+]/g, '');
  const validPhone = phone.replace(/\D/g, '').length >= 10;

  if (!name) return json({ ok: false, error: 'Missing fields' }, 400);
  if (!validPhone && !validEmail) {
    return json({ ok: false, error: 'Missing fields' }, 400);
  }
  const need = clean(body.need, 60) || 'Not sure yet';

  const payload = {
    _subject: `New project enquiry: ${need} — ${name}`,
    _template: 'table',
    _captcha: 'false',
    Name: name,
    Email: validEmail ? email : '-',
    Phone: phone || '-',
    Company: clean(body.company, 160) || '-',
    City: clean(body.city, 80) || '-',
    Need: need,
    Budget: clean(body.budget, 60) || '-',
    'Project details': details || '-',
    'Sent from': 'msbizstudio.com' + clean(body.page, 80),
  };
  if (validEmail) payload._replyto = email;

  try {
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(to), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://msbizstudio.com',
        Referer: 'https://msbizstudio.com/contact.html',
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return json({ ok: false, error: 'Delivery failed' }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'Delivery failed' }, 502);
  }
}

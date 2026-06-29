export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const phone = (body.phone || '').toString().trim();
  const company = (body.company || '').toString().trim();
  const blueprint = (body.blueprint || '').toString().trim();
  const notes = (body.notes || '').toString().trim();

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const text = [
    'New security assessment request from the NDSPS website:',
    '',
    'Name: ' + name,
    'Email: ' + email,
    'Phone: ' + phone,
    'Business / Property: ' + (company || '-'),
    'Selected blueprint: ' + (blueprint || '-'),
    '',
    'Security vulnerabilities & notes:',
    (notes || '-')
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NDSPS Website <onboarding@resend.dev>',
        to: ['info@ndsps.com'],
        reply_to: email,
        subject: 'New Security Request - ' + name,
        text: text
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: 'Email failed to send', detail: detail });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

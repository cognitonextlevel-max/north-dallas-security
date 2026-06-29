export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const phone = (body.phone || '').toString().trim();
  const position = (body.position || '').toString().trim();
  const experience = (body.experience || '').toString().trim();
  const license = (body.license || '').toString().trim();
  const availability = (body.availability || '').toString().trim();
  const resumeName = (body.resumeName || '').toString().trim();
  const resumeData = (body.resumeData || '').toString();

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const text = [
    'New job application from the NDSPS website:',
    '',
    'Name: ' + name,
    'Email: ' + email,
    'Phone: ' + phone,
    'Position of interest: ' + (position || '-'),
    'Years of experience: ' + (experience || '-'),
    'Texas guard license / card: ' + (license || '-'),
    'Availability: ' + (availability || '-'),
    '',
    resumeName ? ('Resume attached: ' + resumeName) : 'No resume attached.'
  ].join('\n');

  const payload = {
    from: 'NDSPS Careers <onboarding@resend.dev>',
    to: ['info@ndsps.com'],
    reply_to: email,
    subject: 'New Job Application - ' + name,
    text: text
  };

  if (resumeName && resumeData) {
    payload.attachments = [{ filename: resumeName, content: resumeData }];
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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

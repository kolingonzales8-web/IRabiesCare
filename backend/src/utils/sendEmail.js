const https = require('https');

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const senderEmail = process.env.FROM_EMAIL || 'no-reply@irabiescare.com';
  const senderName  = process.env.FROM_NAME  || 'iRabiesCare';

  const payload = JSON.stringify({
    sender:      { email: senderEmail, name: senderName },
    to:          [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'accept':       'application/json',
        'content-type': 'application/json',
        'api-key':      process.env.BREVO_API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Brevo email sent:', data);
          resolve(data);
        } else {
          console.error('Brevo error response:', data);
          reject(new Error(`Brevo API error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

module.exports = sendEmail;
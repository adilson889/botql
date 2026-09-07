'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Email via SendGrid (sem dependências externas, só a API HTTP).
 * CONNECT EMAIL SENDGRID "{\"apiKey\":\"...\",\"from\":\"bot@dominio.com\"}"
 * O "target" deve ser o endereço de email destinatário.
 */
module.exports = function emailConnector(credential) {
    const { apiKey, from } = parseCredential(credential);

    return {
        async send(to, text) {
            return httpJson('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: from },
                    subject: 'Mensagem do bot',
                    content: [{ type: 'text/plain', value: text }]
                })
            });
        }
    };
};

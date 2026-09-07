'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * WhatsApp Cloud API (Meta).
 * CONNECT WHATSAPP CLOUD_API "{\"token\":\"...\",\"phoneNumberId\":\"...\"}"
 */
module.exports = function whatsappConnector(credential) {
    const { token, phoneNumberId, apiVersion } = parseCredential(credential);
    const version = apiVersion || 'v20.0';
    const base = `https://graph.facebook.com/${version}/${phoneNumberId}`;

    return {
        async send(to, text) {
            return httpJson(`${base}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: text }
                })
            });
        }
    };
};

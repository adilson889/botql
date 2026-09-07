'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Instagram Messaging API (conta profissional ligada a uma Página, via Graph API).
 * CONNECT INSTAGRAM PAGE "{\"token\":\"...\",\"igUserId\":\"...\"}"
 * O "target" deve ser o IGSID (Instagram-scoped id) do utilizador.
 */
module.exports = function instagramConnector(credential) {
    const { token, igUserId } = parseCredential(credential);
    const url = `https://graph.facebook.com/v20.0/${igUserId}/messages?access_token=${encodeURIComponent(token)}`;

    return {
        async send(igsid, text) {
            return httpJson(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: igsid },
                    message: { text }
                })
            });
        }
    };
};

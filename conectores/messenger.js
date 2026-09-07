'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Facebook Messenger Send API.
 * CONNECT MESSENGER PAGE "token-de-acesso-da-pagina"
 * O "target" deve ser o PSID (page-scoped id) do utilizador.
 */
module.exports = function messengerConnector(credential) {
    const { token } = parseCredential(credential);
    const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(token)}`;

    return {
        async send(psid, text) {
            return httpJson(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: psid },
                    message: { text }
                })
            });
        }
    };
};

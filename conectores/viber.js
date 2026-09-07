'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Viber REST API.
 * CONNECT VIBER BOT "token-da-conta-viber"
 * O "target" deve ser o "receiver" (id do utilizador Viber).
 */
module.exports = function viberConnector(credential) {
    const { token } = parseCredential(credential);

    return {
        async send(receiver, text) {
            return httpJson('https://chatapi.viber.com/pa/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Viber-Auth-Token': token
                },
                body: JSON.stringify({
                    receiver,
                    type: 'text',
                    text
                })
            });
        }
    };
};

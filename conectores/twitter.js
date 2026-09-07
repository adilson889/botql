'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Twitter/X API v2 — Direct Messages.
 * CONNECT TWITTER BEARER "bearer-token-com-permissao-dm"
 * O "target" deve ser o ID numérico do utilizador destinatário.
 */
module.exports = function twitterConnector(credential) {
    const { token } = parseCredential(credential);

    return {
        async send(userId, text) {
            return httpJson('https://api.twitter.com/2/dm_conversations/with/' + userId + '/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });
        }
    };
};

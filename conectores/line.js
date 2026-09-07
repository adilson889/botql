'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * LINE Messaging API.
 * CONNECT LINE BOT "channel-access-token-do-line"
 * O "target" deve ser o userId do LINE.
 */
module.exports = function lineConnector(credential) {
    const { token } = parseCredential(credential);

    return {
        async send(userId, text) {
            return httpJson('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: userId,
                    messages: [{ type: 'text', text }]
                })
            });
        }
    };
};

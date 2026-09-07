'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Slack Web API.
 * CONNECT SLACK BOT "xoxb-token-do-bot"
 * O "target" deve ser o ID do canal ou utilizador (ex: "C0123456").
 */
module.exports = function slackConnector(credential) {
    const { token } = parseCredential(credential);

    return {
        async send(channel, text) {
            return httpJson('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ channel, text })
            });
        }
    };
};

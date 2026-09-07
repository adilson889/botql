'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Telegram Bot API.
 * CONNECT TELEGRAM BOT "123456:ABC-token-do-bot"
 */
module.exports = function telegramConnector(credential) {
    const { token } = parseCredential(credential);
    const base = `https://api.telegram.org/bot${token}`;

    return {
        async send(chatId, text) {
            return httpJson(`${base}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text })
            });
        }
    };
};

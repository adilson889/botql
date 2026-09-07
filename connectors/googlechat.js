'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Google Chat — webhook de um espaço (Space). Não precisa de OAuth quando se
 * usa o webhook do próprio espaço.
 * CONNECT GOOGLECHAT WEBHOOK "https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=..."
 * O "target" é ignorado (o webhook já aponta a um espaço fixo).
 */
module.exports = function googleChatConnector(credential) {
    const { token: url } = parseCredential(credential); // credencial simples = URL do webhook

    return {
        async send(_target, text) {
            return httpJson(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
        }
    };
};

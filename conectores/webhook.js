'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Webhook genérico: entrega a mensagem a qualquer endpoint HTTP próprio.
 * CONNECT WEBHOOK POST "https://meu-servidor.com/receber"
 * ou, com autenticação:
 * CONNECT WEBHOOK POST "{\"url\":\"https://...\",\"secret\":\"...\"}"
 * O "target" é incluído no corpo do pedido, para o servidor decidir o destino.
 */
module.exports = function webhookConnector(credential) {
    const parsed = parseCredential(credential);
    const url = parsed.url || parsed.token; // token guarda a URL quando é string simples
    const secret = parsed.secret;

    return {
        async send(target, text) {
            const headers = { 'Content-Type': 'application/json' };
            if (secret) headers['X-BotQL-Secret'] = secret;

            return httpJson(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ target, text })
            });
        }
    };
};

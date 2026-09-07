'use strict';

/**
 * _shared.js — utilidades comuns aos connectors reais.
 *
 * A credencial de um CONNECT em BotQL é sempre uma única string
 * (CONNECT SERVICO TIPO "credencial"). Quando a plataforma precisa de mais
 * do que um valor (ex: WhatsApp precisa de token + phone_number_id),
 * a credencial deve ser escrita como uma string JSON:
 *
 *   CONNECT WHATSAPP CLOUD_API "{\"token\":\"...\",\"phoneNumberId\":\"...\"}"
 *
 * parseCredential() trata os dois casos: JSON válido vira objeto,
 * qualquer outra coisa fica disponível em { token: credential }.
 */
function parseCredential(credential) {
    if (typeof credential !== 'string') return credential || {};
    try {
        const parsed = JSON.parse(credential);
        if (parsed && typeof parsed === 'object') return parsed;
        return { token: credential };
    } catch {
        return { token: credential };
    }
}

// Wrapper fino sobre fetch: lança erro com o corpo da resposta quando o
// pedido falha, para os erros aparecerem claros nos logs do bot.
async function httpJson(url, options = {}) {
    const res = await fetch(url, options);
    const raw = await res.text();
    let body;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }

    if (!res.ok) {
        const detail = typeof body === 'string' ? body : JSON.stringify(body);
        throw new Error(`BotQL connector: pedido HTTP falhou (${res.status}): ${detail}`);
    }
    return body;
}

module.exports = { parseCredential, httpJson };

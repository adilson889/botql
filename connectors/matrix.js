'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Matrix — envia mensagens de texto a uma sala usando um access token de bot.
 * CONNECT MATRIX BOT "{\"homeserver\":\"https://matrix.org\",\"accessToken\":\"...\"}"
 * O "target" deve ser o room ID (ex: "!sala:matrix.org").
 */
module.exports = function matrixConnector(credential) {
    const { homeserver, accessToken } = parseCredential(credential);

    return {
        async send(roomId, text) {
            const txnId = Date.now();
            const url = `${homeserver}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`;
            return httpJson(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({ msgtype: 'm.text', body: text })
            });
        }
    };
};

'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * Discord — envia mensagem a um canal usando um bot token.
 * CONNECT DISCORD BOT "bot-token-do-discord"
 * O "target" em REPLY/FORWARD/SEND deve ser o ID do canal.
 */
module.exports = function discordConnector(credential) {
    const { token } = parseCredential(credential);

    return {
        async send(channelId, text) {
            return httpJson(`https://discord.com/api/v10/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bot ${token}`
                },
                body: JSON.stringify({ content: text })
            });
        }
    };
};

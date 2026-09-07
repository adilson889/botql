'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * WeChat (conta de serviço/oficial) — API de mensagens customer service.
 * CONNECT WECHAT OFFICIAL "{\"accessToken\":\"...\"}"
 * O "target" deve ser o OpenID do utilizador WeChat.
 *
 * Nota: o accessToken da WeChat expira periodicamente e normalmente exige
 * um passo prévio de refresh (appId + appSecret -> token). Este connector
 * assume que esse refresh já foi feito fora do bot e que recebe um token válido.
 */
module.exports = function wechatConnector(credential) {
    const { accessToken } = parseCredential(credential);
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${encodeURIComponent(accessToken)}`;

    return {
        async send(openId, text) {
            return httpJson(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    touser: openId,
                    msgtype: 'text',
                    text: { content: text }
                })
            });
        }
    };
};

'use strict';

const { parseCredential, httpJson } = require('./_shared.js');

/**
 * SMS via Twilio.
 * CONNECT SMS TWILIO "{\"accountSid\":\"...\",\"authToken\":\"...\",\"from\":\"+244...\"}"
 * O "target" deve ser o número de telefone destinatário, em formato E.164.
 */
module.exports = function smsConnector(credential) {
    const { accountSid, authToken, from } = parseCredential(credential);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    return {
        async send(to, text) {
            const body = new URLSearchParams({ From: from, To: to, Body: text });
            return httpJson(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${auth}`
                },
                body: body.toString()
            });
        }
    };
};

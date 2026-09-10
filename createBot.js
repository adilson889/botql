'use strict';

/**
* createBot.js — ponto de entrada do BotQL.
*
* Lê um ficheiro .sql (com suporte a IMPORT), cria o interpreter, liga os
* connectors reais das plataformas usadas via CONNECT, corre ON START e
* fica pronto a receber mensagens.
*
* Uso:
*   node createBot.js caminho/para/bot.sql
*
* Uso programático:
*   const { createBot } = require('./createBot.js');
*   const bot = await createBot('bot.sql');
*   await bot.receiveMessage('+244900000000', 'quero comprar');
*/

const path = require('path');
const { BotQLInterpreter } = require('./botql.js');
const { ConnectorRegistry, attachConnectors } = require('./Connectors.js');
const { SQLiteDatabase } = require('./Database.js');
const { attachTerminalUI } = require('./Terminal.js');

/**
* @param {string} sqlFilePath Caminho do ficheiro .sql principal do bot.
* @param {object} options
* @param {string} [options.dbPath] Caminho do ficheiro .sqlite. Sem isto,
*   usa MemoryDatabase (sem persistência), que é o omisso do interpreter.
* @param {string} [options.connectorsPath] Caminho alternativo para o JSON
*   de connectors. Por omissão usa o Connectors.json ao lado deste ficheiro.
* @param {boolean} [options.autoStart] Corre ON START automaticamente (omissão: true).
* @param {boolean} [options.terminalUI] Liga o spinner de terminal (Terminal.js)
*   ao onThinking/onReply/onForward/onSend que ainda não tiverem sido definidos
*   pelos connectors reais (omissão: true). Só tem efeito em Node — em
*   browser/WebView não faz nada.
*/
async function createBot(sqlFilePath, options = {}) {
const interpreterOptions = {};
if (options.dbPath) {
interpreterOptions.db = new SQLiteDatabase(options.dbPath);
}

const bot = BotQLInterpreter.fromFile(sqlFilePath, interpreterOptions);

const registry = new ConnectorRegistry(
options.connectorsPath || path.join(__dirname, 'Connectors.json')
);
attachConnectors(bot, registry);

// Depois de attachConnectors, nunca antes: assim o spinner só preenche
// onReply/onForward/onSend quando NÃO há connector real ligado (ex: bot
// sem CONNECT nenhum, só a testar localmente) — com connector real, essas
// respostas já vão para a plataforma verdadeira, e o Terminal.js respeita
// isso e não lhes toca (ver Terminal.js, só substitui o que estiver null).
if (options.terminalUI !== false) {
attachTerminalUI(bot);
}

if (options.autoStart !== false) {
await bot.start();
}

return bot;
}

// Execução direta: node createBot.js caminho/bot.sql
if (require.main === module) {
const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
console.error('Uso: node createBot.js caminho/para/bot.sql');
process.exit(1);
}

createBot(sqlFilePath)
.then((bot) => {
console.log(`BotQL: bot "${bot.botName || '(sem nome)'}" iniciado.`);
if (!bot.running) {
console.log('Aviso: o ficheiro não tem "RUN BOT" — o bot foi carregado mas não marcado como em execução.');
}
})
.catch((err) => {
console.error(err.message);
process.exit(1);
});
}

module.exports = { createBot };
